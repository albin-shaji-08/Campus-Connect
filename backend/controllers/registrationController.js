const Registration = require('../models/Registration');
const User = require('../models/User');
const Event = require('../models/Event');
const { Parser } = require('json2csv');
const PDFDocument = require('pdfkit');

// Register a student for an event
exports.registerForEvent = async (req, res) => {
  try {
    const student_id = req.userId; // MongoDB ObjectId of user
    const role = req.userRole;

    // Only students may register for events
    if (role !== 'student') {
      return res.status(403).json({ msg: 'Only students may register for events.' });
    }
    const { event_id } = req.body;

    // Check if already registered
    const existing = await Registration.findOne({ student_id, event_id });
    if (existing) {
      return res.status(400).json({ msg: 'Already registered for this event.' });
    }

    // Check if event exists and if registration is still open
  const event = await Event.findById(event_id);
  if (!event) return res.status(404).json({ msg: 'Event not found.' });

  // Check if registration closing time has passed
  const now = new Date();
  if (event.registrationClosesAt && now >= event.registrationClosesAt) {
    return res.status(400).json({ msg: 'Registration for this event has closed.' });
  }

  // Check if event has reached maximum participants
  const currentParticipants = await Registration.countDocuments({ event_id: event._id });
  if (event.maxParticipants && currentParticipants >= event.maxParticipants) {
    return res.status(400).json({ msg: 'This event has reached its maximum capacity.' });
  }

  // Ensure we store the actual event _id (ObjectId) in the registration
  const reg = await Registration.create({ student_id, event_id: event._id });
  // populate before returning so client (and logs) see the linked documents
  const populated = await Registration.findById(reg._id).populate('student_id', 'name email dept student_id').populate('event_id');
  console.log('New registration created:', populated);
  res.status(201).json({ msg: 'Registered successfully', registration: populated });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

// Get all registrations for an event (admin)
exports.getRegistrationsByEvent = async (req, res) => {
  try {
    const event_id = req.params.eventId;
    // Defensive access control: ensure requester is authenticated and is either admin or the event owner
    if (!req.userRole || !req.userId) return res.status(401).json({ msg: 'Not authenticated' });

    if (req.userRole !== 'admin') {
      // must be organizer and owner of the event
      if (req.userRole !== 'organizer') return res.status(403).json({ msg: 'Access denied' });
      const event = await Event.findById(event_id).select('created_by');
      if (!event) return res.status(404).json({ msg: 'Event not found' });
      if (event.created_by.toString() !== req.userId.toString()) return res.status(403).json({ msg: 'Access denied: not the event owner' });
    }

    const regs = await Registration.find({ event_id }).populate('student_id', 'name email dept student_id');
    res.status(200).json(regs);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

// Get all events a student registered for
exports.getMyRegistrations = async (req, res) => {
  try {
    const student_id = req.userId;
    console.log('getMyRegistrations for student_id:', student_id);
    const regs = await Registration.find({ student_id }).populate('event_id');
    console.log('Found registrations:', regs.length);
    res.status(200).json(regs);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

// Get registration count for an event (public)
exports.getRegistrationCount = async (req, res) => {
  try {
    const event_id = req.params.eventId;
    const count = await Registration.countDocuments({ event_id });
    res.status(200).json({ count });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

// Unregister from an event (student only)
exports.unregisterFromEvent = async (req, res) => {
  try {
    const student_id = req.userId;
    const role = req.userRole;
    const { event_id } = req.body;

    // Only students may unregister
    if (role !== 'student') {
      return res.status(403).json({ msg: 'Only students may unregister from events.' });
    }

    // Find the registration
    const registration = await Registration.findOne({ student_id, event_id });
    if (!registration) {
      return res.status(404).json({ msg: 'Registration not found. You are not registered for this event.' });
    }

    // Check if event exists
    const event = await Event.findById(event_id);
    if (!event) {
      return res.status(404).json({ msg: 'Event not found.' });
    }

    // Optional: Check if event has already happened (prevent unregistering from past events)
    const now = new Date();
    if (event.date && new Date(event.date) < now) {
      return res.status(400).json({ msg: 'Cannot unregister from past events.' });
    }

    // Delete the registration
    await Registration.findByIdAndDelete(registration._id);

    res.status(200).json({ msg: 'Unregistered successfully' });
  } catch (err) {
    console.error('Unregister error:', err);
    res.status(500).json({ msg: err.message });
  }
};

// Export registrations as CSV
exports.exportRegistrationsCSV = async (req, res) => {
  try {
    const event_id = req.params.eventId;
    
    // Check access control
    if (!req.userRole || !req.userId) return res.status(401).json({ msg: 'Not authenticated' });

    if (req.userRole !== 'admin') {
      if (req.userRole !== 'organizer') return res.status(403).json({ msg: 'Access denied' });
      const event = await Event.findById(event_id).select('created_by title');
      if (!event) return res.status(404).json({ msg: 'Event not found' });
      if (event.created_by.toString() !== req.userId.toString()) return res.status(403).json({ msg: 'Access denied: not the event owner' });
    }

    // Get event details
    const event = await Event.findById(event_id);
    if (!event) return res.status(404).json({ msg: 'Event not found' });

    // Fetch registrations with populated student data
    const regs = await Registration.find({ event_id }).populate('student_id', 'name email dept student_id');
    
    // Format data for CSV
    const csvData = regs.map((reg, index) => ({
      'S.No': index + 1,
      'Name': reg.student_id?.name || 'N/A',
      'Email': reg.student_id?.email || 'N/A',
      'Department': reg.student_id?.dept || 'N/A',
      'Student ID': reg.student_id?.student_id || 'N/A',
      'Registered At': new Date(reg.createdAt).toLocaleString('en-IN', { 
        dateStyle: 'medium', 
        timeStyle: 'short',
        timeZone: 'Asia/Kolkata'
      })
    }));

    // Convert to CSV
    const parser = new Parser();
    const csv = parser.parse(csvData);

    // Set headers for file download
    const filename = `${event.title.replace(/[^a-z0-9]/gi, '_')}_registrations_${Date.now()}.csv`;
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Pragma', 'no-cache');
    
    res.status(200).send(csv);
  } catch (err) {
    console.error('CSV export error:', err);
    res.status(500).json({ msg: err.message });
  }
};

// Export registrations as PDF
exports.exportRegistrationsPDF = async (req, res) => {
  try {
    const event_id = req.params.eventId;
    
    // Check access control
    if (!req.userRole || !req.userId) return res.status(401).json({ msg: 'Not authenticated' });

    if (req.userRole !== 'admin') {
      if (req.userRole !== 'organizer') return res.status(403).json({ msg: 'Access denied' });
      const event = await Event.findById(event_id).select('created_by title');
      if (!event) return res.status(404).json({ msg: 'Event not found' });
      if (event.created_by.toString() !== req.userId.toString()) return res.status(403).json({ msg: 'Access denied: not the event owner' });
    }

    // Get event details
    const event = await Event.findById(event_id);
    if (!event) return res.status(404).json({ msg: 'Event not found' });

    // Fetch registrations with populated student data
    const regs = await Registration.find({ event_id }).populate('student_id', 'name email dept student_id');
    
    // Set headers for file download BEFORE creating the PDF
    const filename = `${event.title.replace(/[^a-z0-9]/gi, '_')}_registrations_${Date.now()}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Pragma', 'no-cache');
    
    // Create PDF document
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    
    // Pipe PDF to response
    doc.pipe(res);

    const pageWidth = 595.28;  // A4 width in points
    const pageHeight = 841.89; // A4 height in points
    const margin = 50;
    const contentWidth = pageWidth - (2 * margin);

    // Simple border
    doc.rect(margin, margin, contentWidth, pageHeight - (2 * margin))
       .lineWidth(1)
       .strokeColor('#000000')
       .stroke();

    // Header
    let currentY = margin + 30;
    doc.fontSize(18).font('Helvetica-Bold').fillColor('#000000')
       .text('EVENT REGISTRATION LIST', margin, currentY, { 
         width: contentWidth, 
         align: 'center' 
       });
    
    currentY += 35;
    
    // Event title
    doc.fontSize(14).font('Helvetica-Bold').fillColor('#000000')
       .text(event.title, margin + 20, currentY, { 
         width: contentWidth - 40, 
         align: 'center' 
       });
    
    currentY += 30;
    
    // Event details
    doc.fontSize(10).font('Helvetica');
    
    if (event.venue) {
      doc.fillColor('#000000').font('Helvetica-Bold')
         .text('Venue: ', margin + 20, currentY, { continued: true })
         .font('Helvetica')
         .text(event.venue);
      currentY += 15;
    }
    
    if (event.date) {
      doc.fillColor('#000000').font('Helvetica-Bold')
         .text('Date: ', margin + 20, currentY, { continued: true })
         .font('Helvetica')
         .text(new Date(event.date).toLocaleDateString('en-IN', { 
           day: 'numeric', month: 'long', year: 'numeric' 
         }));
      currentY += 15;
    }
    
    doc.fillColor('#000000').font('Helvetica-Bold')
       .text('Total Registrations: ', margin + 20, currentY, { continued: true })
       .font('Helvetica')
       .text(regs.length.toString());
    
    currentY += 25;
    
    // Horizontal line
    doc.moveTo(margin + 20, currentY).lineTo(pageWidth - margin - 20, currentY)
       .lineWidth(1).strokeColor('#000000').stroke();
    
    currentY += 20;

    // Table header
    const tableStartY = currentY;
    
    // Calculate proper column widths that fit within the page
    const tableWidth = contentWidth - 40;
    const colWidths = {
      sno: 35,
      name: 120,
      email: 145,
      dept: 70,
      studentId: 90
    };
    
    // Total check
    const totalWidth = colWidths.sno + colWidths.name + colWidths.email + colWidths.dept + colWidths.studentId;
    
    doc.rect(margin + 20, tableStartY, tableWidth, 25)
       .fillAndStroke('#f0f0f0', '#000000');
    
    let xPos = margin + 25;
    
    // Table headers
    doc.fontSize(9).font('Helvetica-Bold').fillColor('#000000');
    doc.text('S.No', xPos, tableStartY + 8, { width: colWidths.sno, align: 'center' });
    xPos += colWidths.sno;
    doc.text('Name', xPos, tableStartY + 8, { width: colWidths.name, align: 'left' });
    xPos += colWidths.name;
    doc.text('Email', xPos, tableStartY + 8, { width: colWidths.email, align: 'left' });
    xPos += colWidths.email;
    doc.text('Dept', xPos, tableStartY + 8, { width: colWidths.dept, align: 'left' });
    xPos += colWidths.dept;
    doc.text('Student ID', xPos, tableStartY + 8, { width: colWidths.studentId, align: 'left' });
    
    currentY = tableStartY + 25;
    
    // Table rows
    doc.font('Helvetica').fontSize(9);
    regs.forEach((reg, index) => {
      // Check if we need a new page
      if (currentY > pageHeight - margin - 80) {
        doc.addPage();
        
        // Redraw border
        doc.rect(margin, margin, contentWidth, pageHeight - (2 * margin))
           .lineWidth(1).strokeColor('#000000').stroke();
        
        currentY = margin + 30;
        
        // Redraw table header
        doc.rect(margin + 20, currentY, tableWidth, 25)
           .fillAndStroke('#f0f0f0', '#000000');
        
        xPos = margin + 25;
        doc.fontSize(9).font('Helvetica-Bold').fillColor('#000000');
        doc.text('S.No', xPos, currentY + 8, { width: colWidths.sno, align: 'center' });
        xPos += colWidths.sno;
        doc.text('Name', xPos, currentY + 8, { width: colWidths.name, align: 'left' });
        xPos += colWidths.name;
        doc.text('Email', xPos, currentY + 8, { width: colWidths.email, align: 'left' });
        xPos += colWidths.email;
        doc.text('Dept', xPos, currentY + 8, { width: colWidths.dept, align: 'left' });
        xPos += colWidths.dept;
        doc.text('Student ID', xPos, currentY + 8, { width: colWidths.studentId, align: 'left' });
        
        currentY += 25;
        doc.font('Helvetica').fontSize(9);
      }

      const rowHeight = 20;
      
      // Row border
      doc.rect(margin + 20, currentY, tableWidth, rowHeight)
         .stroke('#000000');
      
      // Row content
      xPos = margin + 25;
      const textY = currentY + 6;
      
      doc.fillColor('#000000');
      doc.text(index + 1, xPos, textY, { width: colWidths.sno, align: 'center' });
      xPos += colWidths.sno;
      
      doc.text(reg.student_id?.name || 'N/A', xPos, textY, { 
        width: colWidths.name, 
        align: 'left',
        ellipsis: true
      });
      xPos += colWidths.name;
      
      doc.text(reg.student_id?.email || 'N/A', xPos, textY, { 
        width: colWidths.email, 
        align: 'left',
        ellipsis: true
      });
      xPos += colWidths.email;
      
      doc.text(reg.student_id?.dept || 'N/A', xPos, textY, { 
        width: colWidths.dept, 
        align: 'left',
        ellipsis: true
      });
      xPos += colWidths.dept;
      
      doc.text(reg.student_id?.student_id || 'N/A', xPos, textY, { 
        width: colWidths.studentId, 
        align: 'left',
        ellipsis: true
      });
      
      currentY += rowHeight;
    });

    // Footer
    const footerY = pageHeight - margin - 25;
    doc.fontSize(8).font('Helvetica').fillColor('#000000')
       .text(
         'Generated on ' + new Date().toLocaleDateString('en-IN', { 
           day: 'numeric', 
           month: 'long', 
           year: 'numeric'
         }) + ' - CampusConnect',
         margin + 20,
         footerY,
         { width: contentWidth - 40, align: 'center' }
       );

    // Finalize PDF
    doc.end();
  } catch (err) {
    console.error('PDF export error:', err);
    res.status(500).json({ msg: err.message });
  }
};
