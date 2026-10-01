const Panchayat = require('../models/Panchayat');
const User = require('../models/User');
const Complaint = require('../models/Complaint');
const seedAdmin = require('./seedAdmin');

const generatePanchayatCode = async (districtName, panchayatName) => {
  const distAbbr = (districtName || 'GEN').replace(/[^a-zA-Z]/g, '').substring(0, 3).toUpperCase() || 'GEN';
  const cleanPanch = (panchayatName || 'PAN')
    .replace(/\s*(Panchayat|Corporation|Municipality|Grama|Nagar|Town)\s*/gi, '')
    .trim();
  const panchAbbr = (cleanPanch || panchayatName || 'PAN').replace(/[^a-zA-Z]/g, '').substring(0, 3).toUpperCase() || 'PAN';

  const prefix = `${distAbbr}-${panchAbbr}`;

  const existingWithPrefix = await Panchayat.countDocuments({
    panchayatCode: { $regex: `^${prefix}-`, $options: 'i' }
  });

  const seqNum = existingWithPrefix + 1;
  return `${prefix}-${String(seqNum).padStart(3, '0')}`;
};

const backfillPanchayats = async () => {
  try {
    console.log('--- STARTING PANCHAYAT BACKFILL MIGRATION ---');

    // 0. Seed or verify main Admin
    await seedAdmin();

    // 1. Find all panchayat admins
    const admins = await User.find({
      role: { $in: ['panchayat_admin', 'PANCHAYAT_ADMIN'] },
      isDeleted: { $ne: true }
    });

    console.log(`Found ${admins.length} Panchayat Admins in DB.`);

    for (const admin of admins) {
      if (!admin.panchayat || !admin.district) {
        console.log(`Admin ${admin.fullName} (${admin.email}) has missing panchayat or district information. Skipping.`);
        continue;
      }

      // Lookup or create Panchayat matching by name and district
      let panchayat = await Panchayat.findOne({
        name: { $regex: new RegExp(`^${admin.panchayat.trim()}$`, 'i') },
        district: { $regex: new RegExp(`^${admin.district.trim()}$`, 'i') },
        isDeleted: { $ne: true }
      });

      if (!panchayat) {
        console.log(`Panchayat '${admin.panchayat}' in '${admin.district}' not found. Creating it.`);
        const generatedCode = await generatePanchayatCode(admin.district, admin.panchayat);
        panchayat = await Panchayat.create({
          name: admin.panchayat.trim(),
          district: admin.district.trim(),
          status: 'Active',
          adminId: admin._id,
          panchayatCode: generatedCode
        });
      } else {
        if (!panchayat.adminId || panchayat.adminId.toString() !== admin._id.toString()) {
          panchayat.adminId = admin._id;
          await panchayat.save();
          console.log(`Linked Panchayat '${panchayat.name}' adminId reference to admin ${admin.fullName}.`);
        }
      }

      if (!admin.panchayatId || admin.panchayatId.toString() !== panchayat._id.toString()) {
        admin.panchayatId = panchayat._id;
        await admin.save();
        console.log(`Linked Admin ${admin.fullName} (${admin.email}) to Panchayat '${panchayat.name}' (ID: ${panchayat._id}).`);
      }
    }

    // 2. Find all complaints
    const complaints = await Complaint.find();
    console.log(`Found ${complaints.length} complaints to process.`);

    for (const complaint of complaints) {
      if (!complaint.localBody || !complaint.district) {
        console.log(`Complaint ${complaint.complaintId} has missing localBody or district. Skipping.`);
        continue;
      }

      // Lookup or create Panchayat matching by name (localBody) and district
      let panchayat = await Panchayat.findOne({
        name: { $regex: new RegExp(`^${complaint.localBody.trim()}$`, 'i') },
        district: { $regex: new RegExp(`^${complaint.district.trim()}$`, 'i') },
        isDeleted: { $ne: true }
      });

      if (!panchayat) {
        console.log(`Panchayat '${complaint.localBody}' in '${complaint.district}' not found for complaint ${complaint.complaintId}. Creating it.`);
        const generatedCode = await generatePanchayatCode(complaint.district, complaint.localBody);
        panchayat = await Panchayat.create({
          name: complaint.localBody.trim(),
          district: complaint.district.trim(),
          status: 'Active',
          panchayatCode: generatedCode
        });
      }

      if (!complaint.panchayatId || complaint.panchayatId.toString() !== panchayat._id.toString()) {
        complaint.panchayatId = panchayat._id;
        await complaint.save();
        console.log(`Linked Complaint ${complaint.complaintId} to Panchayat '${panchayat.name}' (ID: ${panchayat._id}).`);
      }
    }

    // 3. Find and link all citizens with panchayatId if they have a panchayat name
    const citizens = await User.find({
      role: { $in: ['citizen', 'Citizen'] },
      isDeleted: { $ne: true }
    });
    console.log(`Found ${citizens.length} citizens to check.`);

    for (const citizen of citizens) {
      const pName = citizen.panchayat || citizen.localBody;
      const dName = citizen.district;
      if (!pName || !dName) continue;

      const panchayat = await Panchayat.findOne({
        name: { $regex: new RegExp(`^${pName.trim()}$`, 'i') },
        district: { $regex: new RegExp(`^${dName.trim()}$`, 'i') },
        isDeleted: { $ne: true }
      });

      if (panchayat && (!citizen.panchayatId || citizen.panchayatId.toString() !== panchayat._id.toString())) {
        citizen.panchayatId = panchayat._id;
        await citizen.save();
        console.log(`Linked Citizen ${citizen.fullName} (${citizen.email}) to Panchayat '${panchayat.name}' (ID: ${panchayat._id}).`);
      }
    }

    console.log('--- PANCHAYAT BACKFILL MIGRATION COMPLETED SUCCESSFULLY ---');
  } catch (error) {
    console.error('Panchayat backfill migration failed:', error);
  }
};

module.exports = backfillPanchayats;
