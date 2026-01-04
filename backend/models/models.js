import mongoose from 'mongoose';
const Schema = mongoose.Schema;

// 1. Organizations Model
const OrganizationSchema = new Schema({
  name: { 
    type: String, 
    required: true,
    unique: true, // Add unique constraint
    trim: true    // Remove whitespace
  },
  type: { type: String, required: true },
  address: {
    street: String,
    city: String,
    state: String,
    country: String,
    zipCode: String
  },
  contactEmail: { 
    type: String, 
    required: true,
    unique: true  // Keep email unique too
  },
  contactPhone: String,
  super_admins: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Add compound index for case-insensitive name uniqueness
OrganizationSchema.index({ name: 1 }, { 
  unique: true,
  collation: { locale: 'en', strength: 2 } // Case-insensitive
});

const Organization = mongoose.model('Organization', OrganizationSchema);

// 2. Departments Model
const DepartmentSchema = new Schema({
  organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
  name: { type: String, required: true },
  description: String,
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const Department = mongoose.model('Department', DepartmentSchema);

// 3. Users Model
const UserSchema = new Schema({
  organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
  departmentId: { type: Schema.Types.ObjectId, ref: 'Department' },
  registrationId: { type: String, required: true, unique: true }, 
  firstName: { type: String },
  lastName: { type: String },
  email: { type: String, required: true },
  passwordHash: { type: String },
  role: { type: String, required: true, enum: ['SuperAdmin', 'DepartmentUser', 'Student', 'Faculty'] },
  isActive: { type: Boolean, default: true },
  notificationPreferences: {
    email: { type: Boolean, default: true },
    sms: { type: Boolean, default: false },
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Add a compound index on email and organizationId to ensure uniqueness within each organization
UserSchema.index({ email: 1, organizationId: 1 }, { unique: true });


const User = mongoose.model('User', UserSchema);

// 4. ComplaintTypes Model
const ComplaintTypeSchema = new Schema({
  organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
  name: { type: String, required: true },
  description: String,
  defaultDepartmentId: { type: Schema.Types.ObjectId, ref: 'Department' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const ComplaintType = mongoose.model('ComplaintType', ComplaintTypeSchema);

// 5. Workflows Model - Enhanced version
const WorkflowSchema = new Schema({
  organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
  name: { type: String, required: true },
  description: { type: String },
  isActive: { type: Boolean, default: true },
  complaintTypeId: { type: Schema.Types.ObjectId, ref: 'ComplaintType' },
  departmentId: { type: Schema.Types.ObjectId, ref: 'Department' },
  stages: [{
    id: { type: String, required: true }, // Unique identifier for the stage
    name: { type: String, required: true },
    description: String,
    order: { type: Number, required: true },
    durationInHours: { type: Number, default: 24 }, // Expected duration for SLA
    actions: [{
      type: { type: String, enum: ['NOTIFICATION', 'STATUS_UPDATE', 'ASSIGNMENT', 'ESCALATION'] },
      config: Schema.Types.Mixed // Configuration specific to the action type
    }],
    transitions: [{
      targetStageId: { type: String, required: true },
      condition: {
        type: { type: String, enum: ['ALWAYS', 'TIME_BASED', 'USER_ROLE', 'CUSTOM'] },
        value: Schema.Types.Mixed // Condition-specific configuration
      },
      name: String,
      description: String
    }]
  }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Add index for quick lookup by organization and complaint type
WorkflowSchema.index({ organizationId: 1, complaintTypeId: 1 });

// Create the Workflow model
const Workflow = mongoose.model('Workflow', WorkflowSchema);

// New model for tracking workflow instances for specific complaints
const WorkflowInstanceSchema = new Schema({
  complaintId: { type: Schema.Types.ObjectId, ref: 'Complaint', required: true },
  workflowId: { type: Schema.Types.ObjectId, ref: 'Workflow', required: true },
  currentStageId: { type: String, required: true },
  history: [{
    stageId: { type: String, required: true },
    enteredAt: { type: Date, default: Date.now },
    exitedAt: Date,
    actions: [{
      type: { type: String, required: true },
      performedAt: { type: Date, default: Date.now },
      performedBy: { type: Schema.Types.ObjectId, ref: 'User' },
      result: Schema.Types.Mixed,
      notes: String
    }]
  }],
  isCompleted: { type: Boolean, default: false },
  startedAt: { type: Date, default: Date.now },
  completedAt: Date,
  expectedCompletionDate: Date,
  status: { type: String, enum: ['ACTIVE', 'COMPLETED', 'CANCELED', 'ESCALATED'], default: 'ACTIVE' }
});

// Add indexes for quick lookup and performance
WorkflowInstanceSchema.index({ complaintId: 1 }, { unique: true });
WorkflowInstanceSchema.index({ workflowId: 1 });
WorkflowInstanceSchema.index({ 'history.stageId': 1, 'history.enteredAt': 1 });

const WorkflowInstance = mongoose.model('WorkflowInstance', WorkflowInstanceSchema);

// 6. Complaints Model
const ComplaintSchema = new Schema({
  organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
  complainantId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  complaintTypeId: { type: Schema.Types.ObjectId, ref: 'ComplaintType', required: true },
  departmentId: { type: Schema.Types.ObjectId, ref: 'Department', required: true },
  assignedTo: { type: Schema.Types.ObjectId, ref: 'User' },
  title: { type: String, required: true },
  description: { type: String, required: true },
  currentStage: String,
  status: { type: String, required: true, enum: ['Open', 'In Progress', 'Resolved', 'Closed'] },
  priority: { type: String, required: true, enum: ['Low', 'Medium', 'High', 'Urgent'] },
  attachments: [{
    filename: String,
    fileType: String,
    fileSize: Number,
    url: String
  }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  resolvedAt: Date,
  closedAt: Date
});

const Complaint = mongoose.model('Complaint', ComplaintSchema);

// 7. ComplaintLogs Model
const ComplaintLogSchema = new Schema({
  complaintId: { type: Schema.Types.ObjectId, ref: 'Complaint', required: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  action: { type: String, required: true },
  previousStage: String,
  newStage: String,
  comment: String,
  attachments: [{
    filename: String,
    fileType: String,
    fileSize: Number,
    url: String
  }],
  createdAt: { type: Date, default: Date.now }
});

const ComplaintLog = mongoose.model('ComplaintLog', ComplaintLogSchema);

// 8. Feedback Model
const FeedbackSchema = new Schema({
  complaintId: { type: Schema.Types.ObjectId, ref: 'Complaint', required: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: String,
  createdAt: { type: Date, default: Date.now }
});

const Feedback = mongoose.model('Feedback', FeedbackSchema);

// 9. EscalationRules Model
const EscalationRuleSchema = new Schema({
  organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
  complaintTypeId: { type: Schema.Types.ObjectId, ref: 'ComplaintType', required: true },
  fromStage: { type: String, required: true },
  toStage: { type: String, required: true },
  conditionType: { type: String, required: true },
  conditionValue: Schema.Types.Mixed,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const EscalationRule = mongoose.model('EscalationRule', EscalationRuleSchema);

// 10. Notifications Model
const NotificationSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, required: true },
  message: { type: String, required: true },
  relatedTo: {
    type: { type: String, required: true },
    id: { type: Schema.Types.ObjectId, required: true }
  },
  isRead: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

const Notification = mongoose.model('Notification', NotificationSchema);

export {
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
};