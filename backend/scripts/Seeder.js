import mongoose from 'mongoose';
import bcrypt from 'bcryptjs'; // Using bcryptjs as per authController.js
import dotenv from 'dotenv';
import {
    Organization,
    Department,
    User,
    ComplaintType,
    Workflow,
    WorkflowInstance,
    Complaint,
    ComplaintLog,
    Feedback,
    EscalationRule,
    Notification
} from '../models/models.js'; // Ensure path is correct

// Load environment variables
dotenv.config();

// --- Configuration ---
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/resolvesuite';
const SALT_ROUNDS = 10; // bcryptjs salt rounds
const DEFAULT_PASSWORD = 'password123'; // Consistent default password

// --- Connect to MongoDB ---
mongoose.connect(MONGO_URI)
    .then(() => console.log('MongoDB connected for Seeding'))
    .catch(err => {
        console.error('MongoDB connection error:', err);
        process.exit(1); // Exit if connection fails
    });

// --- Utility to hash passwords ---
const hashPassword = async (password) => {
    const salt = await bcrypt.genSalt(SALT_ROUNDS);
    return bcrypt.hash(password, salt);
};

// --- Main Seeding Function ---
const seedData = async () => {
    console.log('Starting database seeding process...');
    try {
        // --- Clear existing data ---
        console.log('Clearing existing database data...');
        // Clear in reverse order of dependency to avoid potential reference issues
        await Notification.deleteMany({});
        await EscalationRule.deleteMany({});
        await Feedback.deleteMany({});
        await ComplaintLog.deleteMany({});
        await WorkflowInstance.deleteMany({});
        await Complaint.deleteMany({});
        await Workflow.deleteMany({});
        await ComplaintType.deleteMany({});
        await User.deleteMany({}); // Users before Org because Org references User (super_admins)
        await Department.deleteMany({});
        await Organization.deleteMany({});
        console.log('Existing data cleared successfully.');

        // --- Start Seeding SZABIST Data ---
        console.log('Seeding SZABIST data...');

        // 1. Create Organization (SZABIST)
        console.log('Creating Organization: SZABIST...');
        // Create Org first, save, then update super_admins later
        let szabistOrg = new Organization({
            name: 'SZABIST', // Name is unique and indexed case-insensitively
            type: 'University',
            address: {
                street: '154 Clifton',
                city: 'Karachi',
                state: 'Sindh',
                country: 'Pakistan',
                zipCode: '75600'
            },
            contactEmail: 'info@szabist.edu.pk', // Unique email
            contactPhone: '+92 21 111 922 478',
            super_admins: [] // Initialize as empty, will be populated after user creation
        });
        await szabistOrg.save(); // Save to get the _id
        // Re-fetch to ensure we have the latest version if needed (though save() updates the object)
        szabistOrg = await Organization.findById(szabistOrg._id);
        console.log(`Organization SZABIST created with ID: ${szabistOrg._id}`);

        // 2. Create Departments for SZABIST
        console.log('Creating Departments for SZABIST...');
        const departmentsData = [
            { name: 'Academic Affairs', description: 'Handles academic policies, curriculum, and faculty matters.', organizationId: szabistOrg._id },
            { name: 'Student Affairs', description: 'Supports student life, activities, counseling, and discipline.', organizationId: szabistOrg._id },
            { name: 'Finance Department', description: 'Manages fees, scholarships, and financial operations.', organizationId: szabistOrg._id },
            { name: 'IT Services', description: 'Provides technical support, network access, and manages IT infrastructure.', organizationId: szabistOrg._id },
            { name: 'Library', description: 'Manages library resources and services.', organizationId: szabistOrg._id },
            { name: 'Examinations Department', description: 'Conducts and manages examinations and results.', organizationId: szabistOrg._id },
            { name: 'Admissions Office', description: 'Handles student admissions and enrollment.', organizationId: szabistOrg._id },
            { name: 'Facilities Management', description: 'Manages campus buildings, maintenance, and utilities.', organizationId: szabistOrg._id }
        ];
        const savedDepartments = await Department.insertMany(departmentsData);
        console.log(`${savedDepartments.length} Departments created for SZABIST.`);

        // Map department names to IDs for easier reference
        const deptMap = savedDepartments.reduce((map, dept) => {
            map[dept.name] = dept._id;
            return map;
        }, {});
        console.log('Department Map created.');

        // 3. Create Users for SZABIST (NO FACULTY)
        console.log('Creating Users for SZABIST (SuperAdmin, DepartmentUsers, Students only)...');
        const hashedPassword = await hashPassword(DEFAULT_PASSWORD);

        const usersData = [
            // Super Admin (matches role 'SuperAdmin')
            {
                organizationId: szabistOrg._id,
                registrationId: 'SZAB_SUPER_1', // Static ID based on authController logic example
                firstName: 'Uzair',
                lastName: 'Ahmed',
                email: 'superadmin@szabist.edu.pk', // Unique within org
                passwordHash: hashedPassword,
                role: 'SuperAdmin', // Matches enum
                isActive: true // Seed as active user
            },
            // Department Users (matches role 'DepartmentUser')
            {
                organizationId: szabistOrg._id,
                departmentId: deptMap['IT Services'],
                registrationId: 'SZ-IT-001',
                firstName: 'Ali',
                lastName: 'Khan',
                email: 'it.support@szabist.edu.pk', // Unique within org
                passwordHash: hashedPassword,
                role: 'DepartmentUser',
                isActive: true
            },
            {
                organizationId: szabistOrg._id,
                departmentId: deptMap['Academic Affairs'],
                registrationId: 'SZ-AA-001',
                firstName: 'Fatima',
                lastName: 'Ahmed',
                email: 'acad.affairs@szabist.edu.pk', // Unique within org
                passwordHash: hashedPassword,
                role: 'DepartmentUser',
                isActive: true
            },
            {
                organizationId: szabistOrg._id,
                departmentId: deptMap['Student Affairs'],
                registrationId: 'SZ-SA-001',
                firstName: 'Bilal',
                lastName: 'Hassan',
                email: 'std.affairs@szabist.edu.pk', // Unique within org
                passwordHash: hashedPassword,
                role: 'DepartmentUser',
                isActive: true
            },
            {
                organizationId: szabistOrg._id,
                departmentId: deptMap['Finance Department'],
                registrationId: 'SZ-FIN-001',
                firstName: 'Ayesha',
                lastName: 'Malik',
                email: 'finance@szabist.edu.pk', // Unique within org
                passwordHash: hashedPassword,
                role: 'DepartmentUser',
                isActive: true
            },
            {
                organizationId: szabistOrg._id,
                departmentId: deptMap['Facilities Management'],
                registrationId: 'SZ-FM-001',
                firstName: 'Usman',
                lastName: 'Qureshi',
                email: 'facilities@szabist.edu.pk', // Unique within org
                passwordHash: hashedPassword,
                role: 'DepartmentUser',
                isActive: true
            },
            // Students (matches role 'Student')
            {
                organizationId: szabistOrg._id,
                departmentId: deptMap['Student Affairs'], // Can belong to a department if needed, e.g., for advisors
                registrationId: '2023-CS-015', // Unique ID
                firstName: 'Zainab',
                lastName: 'Raza',
                email: 'zainab.raza@student.szabist.edu.pk', // Unique within org
                passwordHash: hashedPassword,
                role: 'Student',
                isActive: true
            },
            {
                organizationId: szabistOrg._id,
                departmentId: deptMap['Student Affairs'],
                registrationId: '2022-BBA-102',
                firstName: 'Ahmed',
                lastName: 'Siddiqui',
                email: 'ahmed.siddiqui@student.szabist.edu.pk', // Unique within org
                passwordHash: hashedPassword,
                role: 'Student',
                isActive: true
            },
            {
                organizationId: szabistOrg._id,
                departmentId: deptMap['Student Affairs'],
                registrationId: '2024-SS-040',
                firstName: 'Sana',
                lastName: 'Mirza',
                email: 'sana.mirza@student.szabist.edu.pk', // Unique within org
                passwordHash: hashedPassword,
                role: 'Student',
                isActive: true
            },
            {
                organizationId: szabistOrg._id,
                departmentId: deptMap['Student Affairs'],
                registrationId: '2023-CS-099',
                firstName: 'Omar',
                lastName: 'Farooq',
                email: 'omar.farooq@student.szabist.edu.pk', // Unique within org
                passwordHash: hashedPassword,
                role: 'Student',
                isActive: true
            }
            // --- NO FACULTY USERS ADDED ---
        ];
        const savedUsers = await User.insertMany(usersData);
        console.log(`${savedUsers.length} Users created for SZABIST.`);

        // Update SZABIST organization with SuperAdmin ID (as done in authController)
        const szabistSuperAdmin = savedUsers.find(u => u.role === 'SuperAdmin');
        if (szabistSuperAdmin) {
            szabistOrg.super_admins.push(szabistSuperAdmin._id);
            await szabistOrg.save();
            console.log(`SuperAdmin ${szabistSuperAdmin.email} linked to SZABIST.`);
        } else {
            console.warn('Could not find SuperAdmin user to link to SZABIST.');
        }

        // Map user emails to IDs for easier reference
        const userMap = savedUsers.reduce((map, user) => {
            map[user.email] = user._id;
            return map;
        }, {});
        console.log('User Map created.');

        // 4. Create Complaint Types for SZABIST
        console.log('Creating Complaint Types for SZABIST...');
        const complaintTypesData = [
            { name: 'IT Support Request', description: 'Issues related to Wi-Fi, portal access, computer labs.', defaultDeptName: 'IT Services' },
            { name: 'Course Registration Problem', description: 'Problems adding/dropping courses, prerequisite issues.', defaultDeptName: 'Academic Affairs' },
            { name: 'Fee Challan / Payment Issue', description: 'Queries or problems regarding fee payments.', defaultDeptName: 'Finance Department' },
            { name: 'Library Service Issue', description: 'Problems with book borrowing, library access, online resources.', defaultDeptName: 'Library' },
            { name: 'Classroom Facility Issue', description: 'Complaints about AC, projectors, furniture in classrooms.', defaultDeptName: 'Facilities Management' },
            { name: 'Grade Discrepancy Inquiry', description: 'Questions or disputes regarding grades.', defaultDeptName: 'Examinations Department' },
            { name: 'General Inquiry', description: 'For general questions not covered elsewhere.', defaultDeptName: 'Student Affairs' }
        ].map(ct => ({ // Map to include organizationId and lookup defaultDepartmentId
            organizationId: szabistOrg._id,
            name: ct.name,
            description: ct.description,
            // Link defaultDepartmentId using the map, default to null if not found
            defaultDepartmentId: deptMap[ct.defaultDeptName] || null
        }));

        const savedComplaintTypes = await ComplaintType.insertMany(complaintTypesData);
        console.log(`${savedComplaintTypes.length} Complaint Types created for SZABIST.`);

        // Map complaint type names to IDs
        const complaintTypeMap = savedComplaintTypes.reduce((map, ct) => {
            map[ct.name] = ct._id;
            return map;
        }, {});
        console.log('Complaint Type Map created.');

        // 5. Create Workflows for SZABIST
        console.log('Creating Workflows for SZABIST...');
        const workflowsData = [
            // Workflow for IT Support
            {
                organizationId: szabistOrg._id,
                name: 'Standard IT Support Workflow',
                description: 'Handles common IT support requests.',
                complaintTypeId: complaintTypeMap['IT Support Request'], // Link to ComplaintType
                departmentId: deptMap['IT Services'], // Link to Department
                isActive: true,
                stages: [ // Array of stages matching the schema
                    { id: 'IT_SUBMITTED', name: 'Submitted', description: 'Request received.', order: 1, durationInHours: 2, actions: [], transitions: [{ targetStageId: 'IT_ASSIGNED', condition: { type: 'ALWAYS' }, name: 'Assign' }] },
                    { id: 'IT_ASSIGNED', name: 'Assigned to Technician', description: 'Request assigned to IT staff.', order: 2, durationInHours: 8, actions: [{ type: 'ASSIGNMENT', config: { assignToRole: 'DepartmentUser', departmentName: 'IT Services' } }, { type: 'NOTIFICATION', config: { recipient: 'Complainant', message: 'Your IT issue has been assigned.' } }], transitions: [{ targetStageId: 'IT_IN_PROGRESS', condition: { type: 'ALWAYS' }, name: 'Start Work' }] },
                    { id: 'IT_IN_PROGRESS', name: 'In Progress', description: 'Work is underway.', order: 3, durationInHours: 48, actions: [{ type: 'STATUS_UPDATE', config: { newStatus: 'In Progress' } }], transitions: [{ targetStageId: 'IT_RESOLVED', condition: { type: 'USER_ROLE', value: 'DepartmentUser' }, name: 'Mark as Resolved' }] }, // Condition matches enum
                    { id: 'IT_RESOLVED', name: 'Resolved', description: 'Issue resolved, pending closure.', order: 4, durationInHours: 72, actions: [{ type: 'STATUS_UPDATE', config: { newStatus: 'Resolved' } }, { type: 'NOTIFICATION', config: { recipient: 'Complainant', message: 'Your IT issue has been marked as resolved.' } }], transitions: [{ targetStageId: 'IT_CLOSED', condition: { type: 'TIME_BASED', value: { duration: 72, unit: 'hours' } }, name: 'Auto-Close after 3 days' }, { targetStageId: 'IT_CLOSED', condition: { type: 'CUSTOM', value: 'ComplainantConfirmation' }, name: 'Close Manually' }] }, // Example conditions
                    { id: 'IT_CLOSED', name: 'Closed', description: 'Case closed.', order: 5, durationInHours: 0, actions: [{ type: 'STATUS_UPDATE', config: { newStatus: 'Closed' } }], transitions: [] }
                ]
            },
            // Workflow for Facility Issues
            {
                organizationId: szabistOrg._id,
                name: 'Facility Maintenance Workflow',
                description: 'Handles classroom and campus facility issues.',
                complaintTypeId: complaintTypeMap['Classroom Facility Issue'],
                departmentId: deptMap['Facilities Management'],
                isActive: true,
                stages: [
                    { id: 'FAC_REPORTED', name: 'Reported', description: 'Issue reported.', order: 1, durationInHours: 4, actions: [], transitions: [{ targetStageId: 'FAC_ASSESSED', condition: { type: 'ALWAYS' } }] },
                    { id: 'FAC_ASSESSED', name: 'Assessed by Facilities', description: 'Issue assessed.', order: 2, durationInHours: 24, actions: [{ type: 'ASSIGNMENT', config: { assignToRole: 'DepartmentUser', departmentName: 'Facilities Management' } }, { type: 'NOTIFICATION', config: { recipient: 'Complainant', message: 'Facility issue reported and is being assessed.' } }], transitions: [{ targetStageId: 'FAC_WORK_SCHEDULED', condition: { type: 'ALWAYS' } }] },
                    { id: 'FAC_WORK_SCHEDULED', name: 'Work Scheduled', description: 'Maintenance scheduled.', order: 3, durationInHours: 72, actions: [{ type: 'STATUS_UPDATE', config: { newStatus: 'In Progress' } }], transitions: [{ targetStageId: 'FAC_COMPLETED', condition: { type: 'USER_ROLE', value: 'DepartmentUser' }, name: 'Mark Work Complete' }] },
                    { id: 'FAC_COMPLETED', name: 'Work Completed', description: 'Maintenance finished.', order: 4, durationInHours: 48, actions: [{ type: 'STATUS_UPDATE', config: { newStatus: 'Resolved' } }, { type: 'NOTIFICATION', config: { recipient: 'Complainant', message: 'The reported facility issue has been addressed.' } }], transitions: [{ targetStageId: 'FAC_CLOSED', condition: { type: 'TIME_BASED', value: { duration: 48, unit: 'hours' } } }] },
                    { id: 'FAC_CLOSED', name: 'Closed', description: 'Request closed.', order: 5, durationInHours: 0, actions: [{ type: 'STATUS_UPDATE', config: { newStatus: 'Closed' } }], transitions: [] }
                ]
            },
             // Basic Workflow for Finance Issues
            {
                organizationId: szabistOrg._id,
                name: 'Finance Query Workflow',
                description: 'Handles fee and payment related queries.',
                complaintTypeId: complaintTypeMap['Fee Challan / Payment Issue'],
                departmentId: deptMap['Finance Department'],
                isActive: true,
                stages: [
                    { id: 'FIN_NEW', name: 'New Query', order: 1, durationInHours: 8, transitions: [{ targetStageId: 'FIN_REVIEW', condition: { type: 'ALWAYS' } }]},
                    { id: 'FIN_REVIEW', name: 'Under Review', order: 2, durationInHours: 48, actions: [{ type: 'STATUS_UPDATE', config: { newStatus: 'In Progress' } }], transitions: [{ targetStageId: 'FIN_RESOLVED', condition: { type: 'USER_ROLE', value: 'DepartmentUser'}, name: 'Mark Resolved' }]},
                    { id: 'FIN_RESOLVED', name: 'Resolved', order: 3, durationInHours: 24, actions: [{ type: 'STATUS_UPDATE', config: { newStatus: 'Resolved' } }], transitions: [{ targetStageId: 'FIN_CLOSED', condition: { type: 'TIME_BASED', value: { duration: 24, unit: 'hours' } } }] },
                    { id: 'FIN_CLOSED', name: 'Closed', order: 4, durationInHours: 0, actions: [{ type: 'STATUS_UPDATE', config: { newStatus: 'Closed' } }], transitions: [] }
                ]
            },
            // Basic Workflow for General Inquiry
            {
                 organizationId: szabistOrg._id,
                 name: 'General Inquiry Workflow',
                 description: 'Handles general student inquiries.',
                 complaintTypeId: complaintTypeMap['General Inquiry'],
                 departmentId: deptMap['Student Affairs'],
                 isActive: true,
                 stages: [
                     { id: 'GI_NEW', name: 'New Inquiry', order: 1, durationInHours: 24, transitions: [{ targetStageId: 'GI_RESPONDED', condition: { type: 'ALWAYS' } }]},
                     { id: 'GI_RESPONDED', name: 'Responded', order: 2, durationInHours: 48, actions: [{ type: 'STATUS_UPDATE', config: { newStatus: 'In Progress' } }], transitions: [{ targetStageId: 'GI_CLOSED', condition: { type: 'TIME_BASED', value: { duration: 48, unit: 'hours' } } }]}, // Should probably resolve before closing
                     { id: 'GI_CLOSED', name: 'Closed', order: 3, durationInHours: 0, actions: [{ type: 'STATUS_UPDATE', config: { newStatus: 'Closed' } }], transitions: [] }
                 ]
            }
        ];
        const savedWorkflows = await Workflow.insertMany(workflowsData);
        console.log(`${savedWorkflows.length} Workflows created for SZABIST.`);

        // Map workflow names to full workflow objects for easy stage/ID lookup
        const workflowMap = savedWorkflows.reduce((map, wf) => {
            map[wf.name] = wf; // Store the whole workflow object
            return map;
        }, {});
        console.log('Workflow Map created.');

        // 6. Create Complaints for SZABIST
        console.log('Creating Complaints for SZABIST...');
        const complaintsInputData = [
            {
                complainantEmail: 'zainab.raza@student.szabist.edu.pk', // User Role: Student
                complaintTypeName: 'IT Support Request',
                title: 'Wi-Fi not working in CS Lab 3',
                description: 'I cannot connect to the SZABIST Wi-Fi network in the Computer Science Lab 3. My registration ID is 2023-CS-015.',
                priority: 'High', // Matches enum
                assignedToEmail: 'it.support@szabist.edu.pk', // User Role: DepartmentUser
                workflowName: 'Standard IT Support Workflow'
            },
            {
                complainantEmail: 'ahmed.siddiqui@student.szabist.edu.pk',
                complaintTypeName: 'Classroom Facility Issue',
                title: 'Projector bulb fused in Room C-101',
                description: 'The projector in classroom C-101 (Clifton Campus) is not working, the bulb seems to be fused. Class scheduled for tomorrow.',
                priority: 'Medium', // Matches enum
                assignedToEmail: 'facilities@szabist.edu.pk',
                workflowName: 'Facility Maintenance Workflow'
            },
            {
                complainantEmail: 'sana.mirza@student.szabist.edu.pk',
                complaintTypeName: 'Fee Challan / Payment Issue',
                title: 'Incorrect Late Fee Charged',
                description: 'My fee challan for this semester includes a late fee charge, but I paid before the deadline. Please check record for Reg ID 2024-SS-040.',
                priority: 'Urgent', // Matches enum
                assignedToEmail: 'finance@szabist.edu.pk',
                workflowName: 'Finance Query Workflow'
            },
            {
                complainantEmail: 'omar.farooq@student.szabist.edu.pk',
                complaintTypeName: 'General Inquiry',
                title: 'Question about Student Society Elections',
                description: 'When will the dates for the student society elections be announced?',
                priority: 'Low', // Matches enum
                assignedToEmail: 'std.affairs@szabist.edu.pk',
                workflowName: 'General Inquiry Workflow'
            }
        ];

        const complaintsToCreate = [];
        const workflowInstancesToCreate = [];
        const complaintLogsToCreate = [];
        const notificationsToCreate = [];

        for (const data of complaintsInputData) {
            const complainantId = userMap[data.complainantEmail];
            const complaintTypeId = complaintTypeMap[data.complaintTypeName];
            const assignedToId = userMap[data.assignedToEmail];
            const workflow = workflowMap[data.workflowName]; // Get full workflow object

            // Robust checks for linked data
            if (!complainantId) { console.warn(`Skipping complaint "${data.title}": Complainant email "${data.complainantEmail}" not found in userMap.`); continue; }
            if (!complaintTypeId) { console.warn(`Skipping complaint "${data.title}": Complaint Type "${data.complaintTypeName}" not found in complaintTypeMap.`); continue; }
            if (!assignedToId) { console.warn(`Skipping complaint "${data.title}": Assignee email "${data.assignedToEmail}" not found in userMap.`); continue; }
            if (!workflow) { console.warn(`Skipping complaint "${data.title}": Workflow "${data.workflowName}" not found in workflowMap.`); continue; }
            if (!workflow.stages || workflow.stages.length === 0) { console.warn(`Skipping complaint "${data.title}": Workflow "${data.workflowName}" has no stages defined.`); continue; }

            // Determine the responsible department (use default from type, fallback to workflow's dept or Student Affairs)
            const complaintTypeDoc = savedComplaintTypes.find(ct => ct._id.equals(complaintTypeId));
            const departmentId = complaintTypeDoc?.defaultDepartmentId || workflow.departmentId || deptMap['Student Affairs']; // Ensure a department is assigned

            if (!departmentId) { console.warn(`Skipping complaint "${data.title}": Could not determine a valid departmentId.`); continue; }

            // Find the initial stage (order 1 or lowest order)
            const initialStage = workflow.stages.reduce((minStage, currentStage) =>
                (!minStage || currentStage.order < minStage.order) ? currentStage : minStage,
            null); // Find stage with lowest order number

             if (!initialStage) {
                 console.warn(`Skipping complaint "${data.title}" because workflow "${workflow.name}" has no stages.`);
                 continue;
             }
             if (!initialStage.id) {
                 console.warn(`Skipping complaint "${data.title}" because the initial stage "${initialStage.name}" in workflow "${workflow.name}" is missing an ID.`);
                 continue;
             }

            // Prepare Complaint document
            const complaintData = {
                organizationId: szabistOrg._id,
                complainantId: complainantId,
                complaintTypeId: complaintTypeId,
                departmentId: departmentId, // Use determined department ID
                assignedTo: assignedToId,
                title: data.title,
                description: data.description,
                currentStage: initialStage.name, // Use stage NAME for display in Complaint model
                status: 'Open', // Initial status (matches enum)
                priority: data.priority, // Matches enum
                attachments: [], // Add sample attachments if needed
                createdAt: new Date(Date.now() - Math.random() * 5 * 24 * 60 * 60 * 1000), // Random time in last 5 days
            };
            complaintData.updatedAt = complaintData.createdAt;
            complaintsToCreate.push(complaintData);
        }

        // Insert all complaints
        const savedComplaints = await Complaint.insertMany(complaintsToCreate);
        console.log(`${savedComplaints.length} Complaints created for SZABIST.`);

        // Create corresponding WorkflowInstances, Logs, and Notifications for each saved complaint
        for (const complaint of savedComplaints) {
            // Find the input data and workflow again to get the initial stage ID
            // (Could be optimized by storing workflow/stage info with complaintData before insertMany)
            const inputData = complaintsInputData.find(d => d.title === complaint.title);
            if (!inputData) { console.warn(`Could not find input data for complaint "${complaint.title}" to create instance/log.`); continue; }

            const workflow = workflowMap[inputData.workflowName];
             if (!workflow || !workflow.stages || workflow.stages.length === 0) continue; // Skip if workflow invalid

             // Find the initial stage again
             const initialStage = workflow.stages.reduce((minStage, currentStage) =>
                 (!minStage || currentStage.order < minStage.order) ? currentStage : minStage,
             null);

             if (!initialStage || !initialStage.id) continue; // Skip if initial stage invalid

            // 7. Create Workflow Instance (references Complaint and Workflow)
            workflowInstancesToCreate.push({
                complaintId: complaint._id, // Link to the created complaint
                workflowId: workflow._id, // Link to the workflow definition
                currentStageId: initialStage.id, // Use stage ID here
                history: [{ // Initial history entry
                    stageId: initialStage.id, // Use stage ID
                    enteredAt: complaint.createdAt,
                    actions: [] // No actions performed yet at creation
                }],
                isCompleted: false,
                startedAt: complaint.createdAt,
                status: 'ACTIVE' // Initial instance status (matches enum)
                // expectedCompletionDate could be calculated based on workflow stages duration
            });

            // 8. Create Initial Complaint Log (references Complaint and User)
            complaintLogsToCreate.push({
                complaintId: complaint._id,
                userId: complaint.complainantId, // Action performed by complainant (submission)
                action: 'CREATED', // Log action type
                previousStage: null,
                newStage: initialStage.name, // Log stage NAME
                comment: 'Complaint submitted.',
                createdAt: complaint.createdAt
            });

             // 11. Create Initial Assignment Notification (if assigned)
            if (complaint.assignedTo) {
                 notificationsToCreate.push({
                    userId: complaint.assignedTo, // Notify the assigned user
                    type: 'ASSIGNMENT', // Notification type
                    message: `New complaint assigned: "${complaint.title}"`,
                    relatedTo: { // Link back to the complaint
                        type: 'Complaint', // Matches schema
                        id: complaint._id
                    },
                    isRead: false,
                    createdAt: complaint.createdAt
                });
            }
        }

        // Insert Instances, Logs, Notifications
        if (workflowInstancesToCreate.length > 0) {
            await WorkflowInstance.insertMany(workflowInstancesToCreate);
            console.log(`${workflowInstancesToCreate.length} Workflow Instances created.`);
        }
         if (complaintLogsToCreate.length > 0) {
             await ComplaintLog.insertMany(complaintLogsToCreate);
             console.log(`${complaintLogsToCreate.length} initial Complaint Logs created.`);
         }
        if (notificationsToCreate.length > 0) {
             await Notification.insertMany(notificationsToCreate);
             console.log(`${notificationsToCreate.length} initial Assignment Notifications created.`);
         }


        // 9. Create Sample Feedback (Optional - matches FeedbackSchema)
        console.log('Creating sample Feedback (if applicable)...');
        const complaintForFeedback = savedComplaints[0]; // Pick the first created complaint
        if (complaintForFeedback) {
            const feedbackData = [{
                complaintId: complaintForFeedback._id,
                userId: complaintForFeedback.complainantId, // Feedback from the complainant
                rating: 4, // Matches schema (min 1, max 5)
                comment: 'The issue was handled reasonably well, but took a bit long.',
                createdAt: new Date() // Assume feedback given now
            }];
            // await Feedback.insertMany(feedbackData); // Uncomment to create
            // console.log('Sample Feedback created.');
            console.log('Sample Feedback generation skipped (code is commented out).');
        }


        // 10. Create Escalation Rules (Optional - matches EscalationRuleSchema)
        console.log('Creating sample Escalation Rules (if applicable)...');
        const itWorkflowForRules = workflowMap['Standard IT Support Workflow'];
        const financeWorkflowForRules = workflowMap['Finance Query Workflow'];

        // Check if the necessary workflows exist before creating rules for them
        if (itWorkflowForRules && financeWorkflowForRules) {
             const escalationRulesData = [
                // Escalate if IT issue is not assigned within 8 hours
                {
                    organizationId: szabistOrg._id,
                    complaintTypeId: complaintTypeMap['IT Support Request'], // Rule applies to this type
                    fromStage: 'IT_SUBMITTED', // Stage ID where the timer starts
                    toStage: 'IT_ASSIGNED',   // Stage ID it should have transitioned TO (or define escalation target)
                    conditionType: 'TIME_BASED', // Matches schema enum
                    conditionValue: { duration: 8, unit: 'hours' }, // Value for TIME_BASED condition
                    // 'action' field could be added to EscalationRuleSchema to define what happens
                    createdAt: new Date(),
                    updatedAt: new Date()
                },
                // Escalate if Finance review takes more than 72 hours
                 {
                    organizationId: szabistOrg._id,
                    complaintTypeId: complaintTypeMap['Fee Challan / Payment Issue'],
                    fromStage: 'FIN_REVIEW', // Stage ID
                    toStage: 'FIN_RESOLVED', // Stage ID
                    conditionType: 'TIME_BASED',
                    conditionValue: { duration: 72, unit: 'hours' },
                    createdAt: new Date(),
                    updatedAt: new Date()
                }
            ];
            // await EscalationRule.insertMany(escalationRulesData); // Uncomment to create
            // console.log(`${escalationRulesData.length} Escalation Rules created.`);
            console.log('Sample Escalation Rule generation skipped (code is commented out).');
        } else {
             console.warn('Skipping Escalation Rule creation because required workflows (IT Support and/or Finance Query) were not found.');
        }


        console.log('-----------------------------------------');
        console.log('Database seeded successfully with SZABIST data!');
        console.log('Roles seeded: SuperAdmin, DepartmentUser, Student.');
        console.log('NO FACULTY USERS WERE CREATED.');
        console.log('Sample Feedback and Escalation Rules are commented out.');
        console.log('-----------------------------------------');

    } catch (err) {
        console.error('Error during database seeding:', err);
        // Attempt to log more specific Mongoose validation errors if available
        if (err.errors) {
            for (const field in err.errors) {
                console.error(`Validation Error Field: ${field}, Message: ${err.errors[field].message}`);
            }
        }
    } finally {
        // Close the connection after seeding
        mongoose.connection.close()
            .then(() => console.log('MongoDB connection closed.'))
            .catch(err => console.error('Error closing MongoDB connection:', err));
    }
};

// --- Execute the seed function ---
seedData();