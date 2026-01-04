// Create a new file: services/workflowTemplateService.js

import { v4 as uuidv4 } from 'uuid';

/**
 * Template categories to organize the templates
 */
export const TEMPLATE_CATEGORIES = {
    BASIC: 'basic',
    ACADEMIC: 'academic',
    ADMINISTRATIVE: 'administrative',
    FACILITIES: 'facilities',
    IT_SUPPORT: 'it_support',
    CUSTOM: 'custom'
};

/**
 * Workflow template library providing ready-to-use workflow configurations
 * for various educational institution scenarios
 */
export const workflowTemplateService = {
    /**
     * Get all available workflow templates
     */
    getAllTemplates: () => {
        return [
            ...basicTemplates,
            ...academicTemplates,
            ...administrativeTemplates,
            ...facilitiesTemplates,
            ...itSupportTemplates
        ];
    },

    /**
     * Get templates by category
     */
    getTemplatesByCategory: (category) => {
        switch (category) {
            case TEMPLATE_CATEGORIES.BASIC:
                return basicTemplates;
            case TEMPLATE_CATEGORIES.ACADEMIC:
                return academicTemplates;
            case TEMPLATE_CATEGORIES.ADMINISTRATIVE:
                return administrativeTemplates;
            case TEMPLATE_CATEGORIES.FACILITIES:
                return facilitiesTemplates;
            case TEMPLATE_CATEGORIES.IT_SUPPORT:
                return itSupportTemplates;
            default:
                return [];
        }
    },

    /**
     * Get template by ID
     */
    getTemplateById: (templateId) => {
        return allTemplates.find(template => template.id === templateId);
    }
};

// Basic workflow templates suitable for any complaint type
const basicTemplates = [
    {
        id: 'basic-linear-3-step',
        name: 'Simple 3-Step Resolution',
        description: 'Basic linear workflow with review, processing, and resolution stages',
        category: TEMPLATE_CATEGORIES.BASIC,
        icon: 'workflow',
        stages: [
            {
                id: uuidv4(),
                name: 'Initial Review',
                description: 'Review and validate the complaint',
                order: 1,
                durationInHours: 24,
                actions: [
                    {
                        type: 'NOTIFICATION',
                        config: {
                            notifyDepartment: true
                        }
                    },
                    {
                        type: 'ASSIGNMENT',
                        config: {
                            assignmentType: 'AUTO',
                            findAvailableUser: true
                        }
                    }
                ],
                transitions: [
                    {
                        targetStageId: 'processing_stage',
                        condition: { type: 'ALWAYS' },
                        name: 'Start Processing'
                    }
                ]
            },
            {
                id: 'processing_stage',
                name: 'Processing',
                description: 'Work on resolving the complaint',
                order: 2,
                durationInHours: 48,
                actions: [
                    {
                        type: 'STATUS_UPDATE',
                        config: {
                            status: 'In Progress',
                            updateReason: 'Complaint is being processed'
                        }
                    }
                ],
                transitions: [
                    {
                        targetStageId: 'resolution_stage',
                        condition: { type: 'ALWAYS' },
                        name: 'Complete Resolution'
                    }
                ]
            },
            {
                id: 'resolution_stage',
                name: 'Resolution',
                description: 'Complete the resolution and close the complaint',
                order: 3,
                durationInHours: 24,
                actions: [
                    {
                        type: 'STATUS_UPDATE',
                        config: {
                            status: 'Resolved',
                            updateReason: 'Complaint has been resolved'
                        }
                    },
                    {
                        type: 'NOTIFICATION',
                        config: {
                            notifyComplainant: true,
                            customMessage: 'Your complaint has been resolved. Please review the resolution.'
                        }
                    }
                ],
                transitions: []
            }
        ]
    },
    {
        id: 'basic-with-feedback',
        name: 'Resolution with Feedback',
        description: 'Linear workflow that includes a feedback stage',
        category: TEMPLATE_CATEGORIES.BASIC,
        icon: 'message-square',
        stages: [
            {
                id: uuidv4(),
                name: 'Initial Review',
                description: 'Review and validate the complaint',
                order: 1,
                durationInHours: 24,
                actions: [
                    {
                        type: 'NOTIFICATION',
                        config: {
                            notifyDepartment: true
                        }
                    }
                ],
                transitions: [
                    {
                        targetStageId: 'processing_stage',
                        condition: { type: 'ALWAYS' },
                        name: 'Start Processing'
                    }
                ]
            },
            {
                id: 'processing_stage',
                name: 'Processing',
                description: 'Work on resolving the complaint',
                order: 2,
                durationInHours: 48,
                actions: [
                    {
                        type: 'STATUS_UPDATE',
                        config: {
                            status: 'In Progress',
                            updateReason: 'Complaint is being processed'
                        }
                    }
                ],
                transitions: [
                    {
                        targetStageId: 'resolution_stage',
                        condition: { type: 'ALWAYS' },
                        name: 'Complete Resolution'
                    }
                ]
            },
            {
                id: 'resolution_stage',
                name: 'Resolution',
                description: 'Complete the resolution',
                order: 3,
                durationInHours: 24,
                actions: [
                    {
                        type: 'STATUS_UPDATE',
                        config: {
                            status: 'Resolved',
                            updateReason: 'Complaint has been resolved'
                        }
                    },
                    {
                        type: 'NOTIFICATION',
                        config: {
                            notifyComplainant: true,
                            customMessage: 'Your complaint has been resolved. Please provide feedback.'
                        }
                    }
                ],
                transitions: [
                    {
                        targetStageId: 'feedback_stage',
                        condition: { type: 'TIME_BASED', value: 72 },
                        name: 'Wait for Feedback'
                    }
                ]
            },
            {
                id: 'feedback_stage',
                name: 'Feedback Collection',
                description: 'Collect feedback from complainant',
                order: 4,
                durationInHours: 72,
                actions: [],
                transitions: [
                    {
                        targetStageId: 'closed_stage',
                        condition: { type: 'TIME_BASED', value: 72 },
                        name: 'Close Complaint'
                    }
                ]
            },
            {
                id: 'closed_stage',
                name: 'Closed',
                description: 'Complaint closed',
                order: 5,
                durationInHours: 1,
                actions: [
                    {
                        type: 'STATUS_UPDATE',
                        config: {
                            status: 'Closed',
                            updateReason: 'Complaint has been closed after resolution'
                        }
                    }
                ],
                transitions: []
            }
        ]
    },
    {
        id: 'basic-multi-approval',
        name: 'Multi-Level Approval',
        description: 'Workflow with multiple approval stages for complex complaints',
        category: TEMPLATE_CATEGORIES.BASIC,
        icon: 'check-square',
        stages: [
            {
                id: uuidv4(),
                name: 'Intake',
                description: 'Receive and log the complaint',
                order: 1,
                durationInHours: 24,
                actions: [
                    {
                        type: 'NOTIFICATION',
                        config: {
                            notifyDepartment: true
                        }
                    }
                ],
                transitions: [
                    {
                        targetStageId: 'first_approval',
                        condition: { type: 'ALWAYS' },
                        name: 'Send for First Approval'
                    }
                ]
            },
            {
                id: 'first_approval',
                name: 'Department Approval',
                description: 'First level of approval by department head',
                order: 2,
                durationInHours: 48,
                actions: [
                    {
                        type: 'STATUS_UPDATE',
                        config: {
                            status: 'In Progress',
                            updateReason: 'Under department review'
                        }
                    }
                ],
                transitions: [
                    {
                        targetStageId: 'second_approval',
                        condition: { type: 'ALWAYS' },
                        name: 'Send for Second Approval'
                    }
                ]
            },
            {
                id: 'second_approval',
                name: 'Administrative Approval',
                description: 'Second level of approval by administration',
                order: 3,
                durationInHours: 72,
                actions: [],
                transitions: [
                    {
                        targetStageId: 'implementation',
                        condition: { type: 'ALWAYS' },
                        name: 'Proceed to Implementation'
                    }
                ]
            },
            {
                id: 'implementation',
                name: 'Implementation',
                description: 'Implement the approved solution',
                order: 4,
                durationInHours: 120,
                actions: [],
                transitions: [
                    {
                        targetStageId: 'resolution_stage',
                        condition: { type: 'ALWAYS' },
                        name: 'Complete Resolution'
                    }
                ]
            },
            {
                id: 'resolution_stage',
                name: 'Resolution',
                description: 'Complete the resolution and close the complaint',
                order: 5,
                durationInHours: 24,
                actions: [
                    {
                        type: 'STATUS_UPDATE',
                        config: {
                            status: 'Resolved',
                            updateReason: 'Complaint has been resolved'
                        }
                    },
                    {
                        type: 'NOTIFICATION',
                        config: {
                            notifyComplainant: true,
                            customMessage: 'Your complaint has been resolved after multi-level approval.'
                        }
                    }
                ],
                transitions: []
            }
        ]
    },
    {
        id: 'basic-time-sensitive',
        name: 'Time-Sensitive Resolution',
        description: 'Expedited workflow with shorter timeframes for urgent issues',
        category: TEMPLATE_CATEGORIES.BASIC,
        icon: 'clock',
        stages: [
            {
                id: uuidv4(),
                name: 'Urgent Review',
                description: 'Immediate review of the urgent complaint',
                order: 1,
                durationInHours: 4,
                actions: [
                    {
                        type: 'NOTIFICATION',
                        config: {
                            notifyDepartment: true
                        }
                    },
                    {
                        type: 'ASSIGNMENT',
                        config: {
                            assignmentType: 'AUTO',
                            findAvailableUser: true
                        }
                    }
                ],
                transitions: [
                    {
                        targetStageId: 'urgent_processing',
                        condition: { type: 'ALWAYS' },
                        name: 'Start Urgent Processing'
                    }
                ]
            },
            {
                id: 'urgent_processing',
                name: 'Expedited Processing',
                description: 'Prioritized resolution of the complaint',
                order: 2,
                durationInHours: 8,
                actions: [
                    {
                        type: 'STATUS_UPDATE',
                        config: {
                            status: 'In Progress',
                            updateReason: 'Urgent complaint is being processed'
                        }
                    }
                ],
                transitions: [
                    {
                        targetStageId: 'urgent_resolution',
                        condition: { type: 'ALWAYS' },
                        name: 'Complete Urgent Resolution'
                    },
                    {
                        targetStageId: 'escalation',
                        condition: { type: 'TIME_BASED', value: 8 },
                        name: 'Escalate If Not Resolved'
                    }
                ]
            },
            {
                id: 'escalation',
                name: 'Escalation',
                description: 'Escalate to higher authority if not resolved in time',
                order: 3,
                durationInHours: 4,
                actions: [
                    {
                        type: 'ESCALATION',
                        config: {
                            escalationReason: 'Time-sensitive issue not resolved within SLA',
                            increasePriority: true
                        }
                    },
                    {
                        type: 'NOTIFICATION',
                        config: {
                            notifyDepartment: true,
                            customMessage: 'This urgent complaint has been escalated due to SLA breach.'
                        }
                    }
                ],
                transitions: [
                    {
                        targetStageId: 'urgent_resolution',
                        condition: { type: 'ALWAYS' },
                        name: 'Continue to Resolution'
                    }
                ]
            },
            {
                id: 'urgent_resolution',
                name: 'Urgent Resolution',
                description: 'Complete the resolution of the urgent complaint',
                order: 4,
                durationInHours: 4,
                actions: [
                    {
                        type: 'STATUS_UPDATE',
                        config: {
                            status: 'Resolved',
                            updateReason: 'Urgent complaint has been resolved'
                        }
                    },
                    {
                        type: 'NOTIFICATION',
                        config: {
                            notifyComplainant: true,
                            customMessage: 'Your urgent complaint has been resolved.'
                        }
                    }
                ],
                transitions: []
            }
        ]
    }
];

// Academic-specific workflow templates
const academicTemplates = [
    {
        id: 'academic-grade-dispute',
        name: 'Grade Dispute Resolution',
        description: 'Specialized workflow for handling grade-related complaints',
        category: TEMPLATE_CATEGORIES.ACADEMIC,
        icon: 'file-text',
        stages: [
            {
                id: uuidv4(),
                name: 'Initial Assessment',
                description: 'Review and validate the grade dispute',
                order: 1,
                durationInHours: 48,
                actions: [
                    {
                        type: 'NOTIFICATION',
                        config: {
                            notifyDepartment: true
                        }
                    }
                ],
                transitions: [
                    {
                        targetStageId: 'faculty_review',
                        condition: { type: 'ALWAYS' },
                        name: 'Send to Faculty for Review'
                    }
                ]
            },
            {
                id: 'faculty_review',
                name: 'Faculty Review',
                description: 'Review by course instructor',
                order: 2,
                durationInHours: 72,
                actions: [
                    {
                        type: 'STATUS_UPDATE',
                        config: {
                            status: 'In Progress',
                            updateReason: 'Under faculty review'
                        }
                    }
                ],
                transitions: [
                    {
                        targetStageId: 'department_chair_review',
                        condition: { type: 'ALWAYS' },
                        name: 'Send to Department Chair'
                    }
                ]
            },
            {
                id: 'department_chair_review',
                name: 'Department Chair Review',
                description: 'Review by department chair',
                order: 3,
                durationInHours: 72,
                actions: [],
                transitions: [
                    {
                        targetStageId: 'decision',
                        condition: { type: 'ALWAYS' },
                        name: 'Make Final Decision'
                    }
                ]
            },
            {
                id: 'decision',
                name: 'Final Decision',
                description: 'Final determination on the grade dispute',
                order: 4,
                durationInHours: 48,
                actions: [],
                transitions: [
                    {
                        targetStageId: 'update_records',
                        condition: { type: 'ALWAYS' },
                        name: 'Update Academic Records'
                    }
                ]
            },
            {
                id: 'update_records',
                name: 'Update Records',
                description: 'Update student records if necessary',
                order: 5,
                durationInHours: 24,
                actions: [],
                transitions: [
                    {
                        targetStageId: 'resolution',
                        condition: { type: 'ALWAYS' },
                        name: 'Complete Resolution'
                    }
                ]
            },
            {
                id: 'resolution',
                name: 'Resolution Notification',
                description: 'Notify student of the outcome',
                order: 6,
                durationInHours: 24,
                actions: [
                    {
                        type: 'STATUS_UPDATE',
                        config: {
                            status: 'Resolved',
                            updateReason: 'Grade dispute resolution complete'
                        }
                    },
                    {
                        type: 'NOTIFICATION',
                        config: {
                            notifyComplainant: true,
                            customMessage: 'Your grade dispute has been resolved. Please check the final decision details.'
                        }
                    }
                ],
                transitions: []
            }
        ]
    },
    {
        id: 'academic-academic-misconduct',
        name: 'Academic Misconduct Process',
        description: 'Structured workflow for addressing academic misconduct allegations',
        category: TEMPLATE_CATEGORIES.ACADEMIC,
        icon: 'shield',
        stages: [
            {
                id: uuidv4(),
                name: 'Report Intake',
                description: 'Receive and document the misconduct report',
                order: 1,
                durationInHours: 24,
                actions: [
                    {
                        type: 'NOTIFICATION',
                        config: {
                            notifyDepartment: true
                        }
                    }
                ],
                transitions: [
                    {
                        targetStageId: 'initial_investigation',
                        condition: { type: 'ALWAYS' },
                        name: 'Begin Investigation'
                    }
                ]
            },
            {
                id: 'initial_investigation',
                name: 'Initial Investigation',
                description: 'Preliminary review of evidence',
                order: 2,
                durationInHours: 72,
                actions: [
                    {
                        type: 'STATUS_UPDATE',
                        config: {
                            status: 'In Progress',
                            updateReason: 'Investigation in progress'
                        }
                    }
                ],
                transitions: [
                    {
                        targetStageId: 'student_notification',
                        condition: { type: 'ALWAYS' },
                        name: 'Notify Student'
                    }
                ]
            },
            {
                id: 'student_notification',
                name: 'Student Notification',
                description: 'Inform student of allegations and hearing',
                order: 3,
                durationInHours: 48,
                actions: [],
                transitions: [
                    {
                        targetStageId: 'hearing',
                        condition: { type: 'ALWAYS' },
                        name: 'Schedule Hearing'
                    }
                ]
            },
            {
                id: 'hearing',
                name: 'Academic Hearing',
                description: 'Formal hearing to review evidence and testimony',
                order: 4,
                durationInHours: 120,
                actions: [],
                transitions: [
                    {
                        targetStageId: 'decision',
                        condition: { type: 'ALWAYS' },
                        name: 'Make Determination'
                    }
                ]
            },
            {
                id: 'decision',
                name: 'Decision & Sanctions',
                description: 'Determine outcome and appropriate sanctions if applicable',
                order: 5,
                durationInHours: 72,
                actions: [],
                transitions: [
                    {
                        targetStageId: 'appeal_period',
                        condition: { type: 'ALWAYS' },
                        name: 'Begin Appeal Period'
                    }
                ]
            },
            {
                id: 'appeal_period',
                name: 'Appeal Period',
                description: 'Time allowed for student to appeal decision',
                order: 6,
                durationInHours: 120,
                actions: [],
                transitions: [
                    {
                        targetStageId: 'case_closed',
                        condition: { type: 'TIME_BASED', value: 120 },
                        name: 'Close Case'
                    }
                ]
            },
            {
                id: 'case_closed',
                name: 'Case Closed',
                description: 'Final resolution of the academic misconduct case',
                order: 7,
                durationInHours: 24,
                actions: [
                    {
                        type: 'STATUS_UPDATE',
                        config: {
                            status: 'Resolved',
                            updateReason: 'Academic misconduct case has been closed'
                        }
                    },
                    {
                        type: 'NOTIFICATION',
                        config: {
                            notifyComplainant: true,
                            customMessage: 'The academic misconduct case has been closed. Please refer to the final documentation for details.'
                        }
                    }
                ],
                transitions: []
            }
        ]
    },
    {
        id: 'academic-course-content',
        name: 'Course Content Complaint',
        description: 'Process for addressing concerns about course materials or content',
        category: TEMPLATE_CATEGORIES.ACADEMIC,
        icon: 'book-open',
        stages: [
            {
                id: uuidv4(),
                name: 'Initial Review',
                description: 'Review complaint about course content',
                order: 1,
                durationInHours: 48,
                actions: [
                    {
                        type: 'NOTIFICATION',
                        config: {
                            notifyDepartment: true
                        }
                    }
                ],
                transitions: [
                    {
                        targetStageId: 'instructor_feedback',
                        condition: { type: 'ALWAYS' },
                        name: 'Request Instructor Feedback'
                    }
                ]
            },
            {
                id: 'instructor_feedback',
                name: 'Instructor Feedback',
                description: 'Get input from course instructor',
                order: 2,
                durationInHours: 72,
                actions: [
                    {
                        type: 'STATUS_UPDATE',
                        config: {
                            status: 'In Progress',
                            updateReason: 'Gathering instructor feedback'
                        }
                    }
                ],
                transitions: [
                    {
                        targetStageId: 'curriculum_review',
                        condition: { type: 'ALWAYS' },
                        name: 'Review Against Curriculum Standards'
                    }
                ]
            },
            {
                id: 'curriculum_review',
                name: 'Curriculum Review',
                description: 'Assess content against curriculum standards',
                order: 3,
                durationInHours: 96,
                actions: [],
                transitions: [
                    {
                        targetStageId: 'decision',
                        condition: { type: 'ALWAYS' },
                        name: 'Make Content Decision'
                    }
                ]
            },
            {
                id: 'decision',
                name: 'Decision',
                description: 'Determine whether content changes are needed',
                order: 4,
                durationInHours: 48,
                actions: [],
                transitions: [
                    {
                        targetStageId: 'resolution',
                        condition: { type: 'ALWAYS' },
                        name: 'Implement Resolution'
                    }
                ]
            },
            {
                id: 'resolution',
                name: 'Resolution',
                description: 'Implement any needed changes and notify student',
                order: 5,
                durationInHours: 72,
                actions: [
                    {
                        type: 'STATUS_UPDATE',
                        config: {
                            status: 'Resolved',
                            updateReason: 'Course content complaint has been addressed'
                        }
                    },
                    {
                        type: 'NOTIFICATION',
                        config: {
                            notifyComplainant: true,
                            customMessage: 'Your complaint regarding course content has been resolved. Please see the decision details.'
                        }
                    }
                ],
                transitions: []
            }
        ]
    }
];

// Administrative templates
const administrativeTemplates = [
    {
        id: 'admin-financial-aid',
        name: 'Financial Aid Dispute',
        description: 'Process for handling financial aid complaints and disputes',
        category: TEMPLATE_CATEGORIES.ADMINISTRATIVE,
        icon: 'dollar-sign',
        stages: [
            {
                id: uuidv4(),
                name: 'Initial Assessment',
                description: 'Review and validate the financial aid complaint',
                order: 1,
                durationInHours: 24,
                actions: [
                    {
                        type: 'NOTIFICATION',
                        config: {
                            notifyDepartment: true
                        }
                    }
                ],
                transitions: [
                    {
                        targetStageId: 'document_verification',
                        condition: { type: 'ALWAYS' },
                        name: 'Verify Documentation'
                    }
                ]
            },
            {
                id: 'document_verification',
                name: 'Document Verification',
                description: 'Verify all financial documents and eligibility',
                order: 2,
                durationInHours: 72,
                actions: [
                    {
                        type: 'STATUS_UPDATE',
                        config: {
                            status: 'In Progress',
                            updateReason: 'Verifying financial documentation'
                        }
                    }
                ],
                transitions: [
                    {
                        targetStageId: 'aid_officer_review',
                        condition: { type: 'ALWAYS' },
                        name: 'Pass to Financial Aid Officer'
                    }
                ]
            },
            {
                id: 'aid_officer_review',
                name: 'Financial Aid Officer Review',
                description: 'Detailed review by financial aid department',
                order: 3,
                durationInHours: 48,
                actions: [],
                transitions: [
                    {
                        targetStageId: 'determination',
                        condition: { type: 'ALWAYS' },
                        name: 'Make Determination'
                    }
                ]
            },
            {
                id: 'determination',
                name: 'Aid Determination',
                description: 'Final determination on financial aid adjustments',
                order: 4,
                durationInHours: 48,
                actions: [],
                transitions: [
                    {
                        targetStageId: 'financial_adjustment',
                        condition: { type: 'ALWAYS' },
                        name: 'Process Adjustments If Needed'
                    }
                ]
            },
            {
                id: 'financial_adjustment',
                name: 'Financial Adjustments',
                description: 'Process any necessary financial adjustments',
                order: 5,
                durationInHours: 72,
                actions: [],
                transitions: [
                    {
                        targetStageId: 'resolution',
                        condition: { type: 'ALWAYS' },
                        name: 'Complete Resolution'
                    }
                ]
            },
            {
                id: 'resolution',
                name: 'Resolution',
                description: 'Complete the resolution and inform student',
                order: 6,
                durationInHours: 24,
                actions: [
                    {
                        type: 'STATUS_UPDATE',
                        config: {
                            status: 'Resolved',
                            updateReason: 'Financial aid dispute has been resolved'
                        }
                    },
                    {
                        type: 'NOTIFICATION',
                        config: {
                            notifyComplainant: true,
                            customMessage: 'Your financial aid dispute has been resolved. Please check your updated financial aid information.'
                        }
                    }
                ],
                transitions: []
            }
        ]
    },
    {
        id: 'admin-registration-issue',
        name: 'Registration Issue Process',
        description: 'Workflow for resolving course registration problems',
        category: TEMPLATE_CATEGORIES.ADMINISTRATIVE,
        icon: 'calendar',
        stages: [
            {
                id: uuidv4(),
                name: 'Initial Review',
                description: 'Review registration issue details',
                order: 1,
                durationInHours: 24,
                actions: [
                    {
                        type: 'NOTIFICATION',
                        config: {
                            notifyDepartment: true
                        }
                    }
                ],
                transitions: [
                    {
                        targetStageId: 'verification',
                        condition: { type: 'ALWAYS' },
                        name: 'Verify Student Status'
                    }
                ]
            },
            {
                id: 'verification',
                name: 'Student Status Verification',
                description: 'Verify student enrollment status and eligibility',
                order: 2,
                durationInHours: 24,
                actions: [
                    {
                        type: 'STATUS_UPDATE',
                        config: {
                            status: 'In Progress',
                            updateReason: 'Verifying student status'
                        }
                    }
                ],
                transitions: [
                    {
                        targetStageId: 'registrar_review',
                        condition: { type: 'ALWAYS' },
                        name: 'Send to Registrar'
                    }
                ]
            },
            {
                id: 'registrar_review',
                name: 'Registrar Review',
                description: 'Review by registrar\'s office',
                order: 3,
                durationInHours: 48,
                actions: [],
                transitions: [
                    {
                        targetStageId: 'system_update',
                        condition: { type: 'ALWAYS' },
                        name: 'Update Registration System'
                    }
                ]
            },
            {
                id: 'system_update',
                name: 'Registration System Update',
                description: 'Make necessary changes in registration system',
                order: 4,
                durationInHours: 24,
                actions: [],
                transitions: [
                    {
                        targetStageId: 'resolution',
                        condition: { type: 'ALWAYS' },
                        name: 'Complete Resolution'
                    }
                ]
            },
            {
                id: 'resolution',
                name: 'Resolution',
                description: 'Complete the resolution and notify student',
                order: 5,
                durationInHours: 24,
                actions: [
                    {
                        type: 'STATUS_UPDATE',
                        config: {
                            status: 'Resolved',
                            updateReason: 'Registration issue has been resolved'
                        }
                    },
                    {
                        type: 'NOTIFICATION',
                        config: {
                            notifyComplainant: true,
                            customMessage: 'Your registration issue has been resolved. Please check your updated course registration.'
                        }
                    }
                ],
                transitions: []
            }
        ]
    },
    {
        id: 'admin-policy-violation',
        name: 'Policy Violation Investigation',
        description: 'Process for investigating policy violations on campus',
        category: TEMPLATE_CATEGORIES.ADMINISTRATIVE,
        icon: 'alert-triangle',
        stages: [
            {
                id: uuidv4(),
                name: 'Report Reception',
                description: 'Receive and document the reported violation',
                order: 1,
                durationInHours: 24,
                actions: [
                    {
                        type: 'NOTIFICATION',
                        config: {
                            notifyDepartment: true
                        }
                    }
                ],
                transitions: [
                    {
                        // Continuing the template library in workflowTemplateService.js

                        targetStageId: 'preliminary_review',
                        condition: { type: 'ALWAYS' },
                        name: 'Begin Preliminary Review'
                    }
                ]
            },
            {
                id: 'preliminary_review',
                name: 'Preliminary Review',
                description: 'Initial assessment of reported violation',
                order: 2,
                durationInHours: 48,
                actions: [
                    {
                        type: 'STATUS_UPDATE',
                        config: {
                            status: 'In Progress',
                            updateReason: 'Preliminary review underway'
                        }
                    }
                ],
                transitions: [
                    {
                        targetStageId: 'evidence_gathering',
                        condition: { type: 'ALWAYS' },
                        name: 'Gather Evidence'
                    }
                ]
            },
            {
                id: 'evidence_gathering',
                name: 'Evidence Collection',
                description: 'Gather and document evidence related to the violation',
                order: 3,
                durationInHours: 72,
                actions: [],
                transitions: [
                    {
                        targetStageId: 'interviews',
                        condition: { type: 'ALWAYS' },
                        name: 'Conduct Interviews'
                    }
                ]
            },
            {
                id: 'interviews',
                name: 'Interviews',
                description: 'Interview relevant parties and witnesses',
                order: 4,
                durationInHours: 96,
                actions: [],
                transitions: [
                    {
                        targetStageId: 'determination',
                        condition: { type: 'ALWAYS' },
                        name: 'Make Determination'
                    }
                ]
            },
            {
                id: 'determination',
                name: 'Violation Determination',
                description: 'Determine if a violation occurred and its severity',
                order: 5,
                durationInHours: 48,
                actions: [],
                transitions: [
                    {
                        targetStageId: 'sanction_determination',
                        condition: { type: 'ALWAYS' },
                        name: 'Determine Sanctions'
                    }
                ]
            },
            {
                id: 'sanction_determination',
                name: 'Sanctions',
                description: 'Determine appropriate sanctions if violation confirmed',
                order: 6,
                durationInHours: 48,
                actions: [],
                transitions: [
                    {
                        targetStageId: 'notification',
                        condition: { type: 'ALWAYS' },
                        name: 'Notify Parties'
                    }
                ]
            },
            {
                id: 'notification',
                name: 'Notification',
                description: 'Notify all parties of the outcome',
                order: 7,
                durationInHours: 24,
                actions: [
                    {
                        type: 'STATUS_UPDATE',
                        config: {
                            status: 'Resolved',
                            updateReason: 'Policy violation investigation complete'
                        }
                    },
                    {
                        type: 'NOTIFICATION',
                        config: {
                            notifyComplainant: true,
                            customMessage: 'The policy violation investigation has been completed. Please refer to the notification for details.'
                        }
                    }
                ],
                transitions: []
            }
        ]
    }
];

// Facilities management templates
const facilitiesTemplates = [
    {
        id: 'facilities-maintenance',
        name: 'Maintenance Request',
        description: 'Standard workflow for routine maintenance requests',
        category: TEMPLATE_CATEGORIES.FACILITIES,
        icon: 'tool',
        stages: [
            {
                id: uuidv4(),
                name: 'Request Submission',
                description: 'Review incoming maintenance request',
                order: 1,
                durationInHours: 24,
                actions: [
                    {
                        type: 'NOTIFICATION',
                        config: {
                            notifyDepartment: true
                        }
                    },
                    {
                        type: 'ASSIGNMENT',
                        config: {
                            assignmentType: 'AUTO',
                            findAvailableUser: true
                        }
                    }
                ],
                transitions: [
                    {
                        targetStageId: 'assessment',
                        condition: { type: 'ALWAYS' },
                        name: 'Assess Request'
                    }
                ]
            },
            {
                id: 'assessment',
                name: 'Assessment',
                description: 'Evaluate maintenance requirements and priority',
                order: 2,
                durationInHours: 24,
                actions: [
                    {
                        type: 'STATUS_UPDATE',
                        config: {
                            status: 'In Progress',
                            updateReason: 'Assessment in progress'
                        }
                    }
                ],
                transitions: [
                    {
                        targetStageId: 'scheduling',
                        condition: { type: 'ALWAYS' },
                        name: 'Schedule Maintenance'
                    }
                ]
            },
            {
                id: 'scheduling',
                name: 'Scheduling',
                description: 'Schedule maintenance work',
                order: 3,
                durationInHours: 24,
                actions: [],
                transitions: [
                    {
                        targetStageId: 'execution',
                        condition: { type: 'ALWAYS' },
                        name: 'Begin Work'
                    }
                ]
            },
            {
                id: 'execution',
                name: 'Work Execution',
                description: 'Perform the maintenance work',
                order: 4,
                durationInHours: 72,
                actions: [],
                transitions: [
                    {
                        targetStageId: 'inspection',
                        condition: { type: 'ALWAYS' },
                        name: 'Inspect Work'
                    }
                ]
            },
            {
                id: 'inspection',
                name: 'Quality Inspection',
                description: 'Verify that work meets quality standards',
                order: 5,
                durationInHours: 24,
                actions: [],
                transitions: [
                    {
                        targetStageId: 'closure',
                        condition: { type: 'ALWAYS' },
                        name: 'Close Request'
                    }
                ]
            },
            {
                id: 'closure',
                name: 'Request Closure',
                description: 'Complete paperwork and close the maintenance request',
                order: 6,
                durationInHours: 24,
                actions: [
                    {
                        type: 'STATUS_UPDATE',
                        config: {
                            status: 'Resolved',
                            updateReason: 'Maintenance work completed'
                        }
                    },
                    {
                        type: 'NOTIFICATION',
                        config: {
                            notifyComplainant: true,
                            customMessage: 'Your maintenance request has been completed. Please let us know if you have any concerns.'
                        }
                    }
                ],
                transitions: []
            }
        ]
    },
    {
        id: 'facilities-emergency-repair',
        name: 'Emergency Repair',
        description: 'Expedited process for urgent facility repairs',
        category: TEMPLATE_CATEGORIES.FACILITIES,
        icon: 'alert-circle',
        stages: [
            {
                id: uuidv4(),
                name: 'Emergency Triage',
                description: 'Immediate assessment of emergency repair need',
                order: 1,
                durationInHours: 2,
                actions: [
                    {
                        type: 'NOTIFICATION',
                        config: {
                            notifyDepartment: true
                        }
                    },
                    {
                        type: 'ASSIGNMENT',
                        config: {
                            assignmentType: 'AUTO',
                            findAvailableUser: true
                        }
                    }
                ],
                transitions: [
                    {
                        targetStageId: 'rapid_response',
                        condition: { type: 'ALWAYS' },
                        name: 'Dispatch Team'
                    }
                ]
            },
            {
                id: 'rapid_response',
                name: 'Rapid Response',
                description: 'Send emergency response team to the location',
                order: 2,
                durationInHours: 2,
                actions: [
                    {
                        type: 'STATUS_UPDATE',
                        config: {
                            status: 'In Progress',
                            updateReason: 'Emergency team dispatched'
                        }
                    }
                ],
                transitions: [
                    {
                        targetStageId: 'emergency_repair',
                        condition: { type: 'ALWAYS' },
                        name: 'Perform Emergency Repair'
                    }
                ]
            },
            {
                id: 'emergency_repair',
                name: 'Emergency Repair Work',
                description: 'Complete urgent repairs to address the emergency',
                order: 3,
                durationInHours: 8,
                actions: [],
                transitions: [
                    {
                        targetStageId: 'safety_check',
                        condition: { type: 'ALWAYS' },
                        name: 'Perform Safety Check'
                    }
                ]
            },
            {
                id: 'safety_check',
                name: 'Safety Check',
                description: 'Verify safety and functionality after emergency repair',
                order: 4,
                durationInHours: 2,
                actions: [],
                transitions: [
                    {
                        targetStageId: 'documentation',
                        condition: { type: 'ALWAYS' },
                        name: 'Document Emergency Event'
                    }
                ]
            },
            {
                id: 'documentation',
                name: 'Documentation',
                description: 'Document the emergency and repair details',
                order: 5,
                durationInHours: 4,
                actions: [],
                transitions: [
                    {
                        targetStageId: 'closure',
                        condition: { type: 'ALWAYS' },
                        name: 'Close Emergency Ticket'
                    }
                ]
            },
            {
                id: 'closure',
                name: 'Emergency Closure',
                description: 'Close the emergency repair ticket',
                order: 6,
                durationInHours: 2,
                actions: [
                    {
                        type: 'STATUS_UPDATE',
                        config: {
                            status: 'Resolved',
                            updateReason: 'Emergency repair completed'
                        }
                    },
                    {
                        type: 'NOTIFICATION',
                        config: {
                            notifyComplainant: true,
                            customMessage: 'The emergency repair has been completed. Please let us know if you notice any issues.'
                        }
                    }
                ],
                transitions: []
            }
        ]
    },
    {
        id: 'facilities-renovation',
        name: 'Renovation Request',
        description: 'Process for handling space renovation requests',
        category: TEMPLATE_CATEGORIES.FACILITIES,
        icon: 'layout',
        stages: [
            {
                id: uuidv4(),
                name: 'Request Submission',
                description: 'Review incoming renovation request',
                order: 1,
                durationInHours: 48,
                actions: [
                    {
                        type: 'NOTIFICATION',
                        config: {
                            notifyDepartment: true
                        }
                    }
                ],
                transitions: [
                    {
                        targetStageId: 'initial_review',
                        condition: { type: 'ALWAYS' },
                        name: 'Conduct Initial Review'
                    }
                ]
            },
            {
                id: 'initial_review',
                name: 'Initial Review',
                description: 'Preliminary assessment of renovation feasibility',
                order: 2,
                durationInHours: 72,
                actions: [
                    {
                        type: 'STATUS_UPDATE',
                        config: {
                            status: 'In Progress',
                            updateReason: 'Initial review in progress'
                        }
                    }
                ],
                transitions: [
                    {
                        targetStageId: 'budget_approval',
                        condition: { type: 'ALWAYS' },
                        name: 'Seek Budget Approval'
                    }
                ]
            },
            {
                id: 'budget_approval',
                name: 'Budget Approval',
                description: 'Obtain necessary budgetary approvals',
                order: 3,
                durationInHours: 120,
                actions: [],
                transitions: [
                    {
                        targetStageId: 'design_phase',
                        condition: { type: 'ALWAYS' },
                        name: 'Begin Design Phase'
                    }
                ]
            },
            {
                id: 'design_phase',
                name: 'Design Phase',
                description: 'Develop renovation designs and plans',
                order: 4,
                durationInHours: 168,
                actions: [],
                transitions: [
                    {
                        targetStageId: 'contractor_selection',
                        condition: { type: 'ALWAYS' },
                        name: 'Select Contractors'
                    }
                ]
            },
            {
                id: 'contractor_selection',
                name: 'Contractor Selection',
                description: 'Select contractors for the renovation work',
                order: 5,
                durationInHours: 96,
                actions: [],
                transitions: [
                    {
                        targetStageId: 'scheduling',
                        condition: { type: 'ALWAYS' },
                        name: 'Schedule Work'
                    }
                ]
            },
            {
                id: 'scheduling',
                name: 'Work Scheduling',
                description: 'Schedule the renovation work',
                order: 6,
                durationInHours: 72,
                actions: [],
                transitions: [
                    {
                        targetStageId: 'execution',
                        condition: { type: 'ALWAYS' },
                        name: 'Begin Renovation'
                    }
                ]
            },
            {
                id: 'execution',
                name: 'Renovation Execution',
                description: 'Conduct the renovation work',
                order: 7,
                durationInHours: 240,
                actions: [],
                transitions: [
                    {
                        targetStageId: 'inspection',
                        condition: { type: 'ALWAYS' },
                        name: 'Inspect Completed Work'
                    }
                ]
            },
            {
                id: 'inspection',
                name: 'Final Inspection',
                description: 'Inspect completed renovation work',
                order: 8,
                durationInHours: 48,
                actions: [],
                transitions: [
                    {
                        targetStageId: 'closure',
                        condition: { type: 'ALWAYS' },
                        name: 'Close Renovation Project'
                    }
                ]
            },
            {
                id: 'closure',
                name: 'Project Closure',
                description: 'Complete paperwork and close the renovation request',
                order: 9,
                durationInHours: 48,
                actions: [
                    {
                        type: 'STATUS_UPDATE',
                        config: {
                            status: 'Resolved',
                            updateReason: 'Renovation project completed'
                        }
                    },
                    {
                        type: 'NOTIFICATION',
                        config: {
                            notifyComplainant: true,
                            customMessage: 'Your renovation project has been completed. Please review the work and provide feedback.'
                        }
                    }
                ],
                transitions: []
            }
        ]
    }
];

// IT support templates
const itSupportTemplates = [
    {
        id: 'it-technical-support',
        name: 'Technical Support Ticket',
        description: 'Standard process for handling technical support requests',
        category: TEMPLATE_CATEGORIES.IT_SUPPORT,
        icon: 'cpu',
        stages: [
            {
                id: uuidv4(),
                name: 'Ticket Reception',
                description: 'Receive and categorize the support ticket',
                order: 1,
                durationInHours: 4,
                actions: [
                    {
                        type: 'NOTIFICATION',
                        config: {
                            notifyDepartment: true
                        }
                    },
                    {
                        type: 'ASSIGNMENT',
                        config: {
                            assignmentType: 'AUTO',
                            findAvailableUser: true
                        }
                    }
                ],
                transitions: [
                    {
                        targetStageId: 'initial_diagnosis',
                        condition: { type: 'ALWAYS' },
                        name: 'Begin Diagnosis'
                    }
                ]
            },
            {
                id: 'initial_diagnosis',
                name: 'Initial Diagnosis',
                description: 'Diagnose the technical issue',
                order: 2,
                durationInHours: 8,
                actions: [
                    {
                        type: 'STATUS_UPDATE',
                        config: {
                            status: 'In Progress',
                            updateReason: 'Diagnosing the technical issue'
                        }
                    }
                ],
                transitions: [
                    {
                        targetStageId: 'user_communication',
                        condition: { type: 'ALWAYS' },
                        name: 'Contact User'
                    }
                ]
            },
            {
                id: 'user_communication',
                name: 'User Communication',
                description: 'Communicate with user to gather additional information if needed',
                order: 3,
                durationInHours: 8,
                actions: [],
                transitions: [
                    {
                        targetStageId: 'troubleshooting',
                        condition: { type: 'ALWAYS' },
                        name: 'Begin Troubleshooting'
                    }
                ]
            },
            {
                id: 'troubleshooting',
                name: 'Troubleshooting',
                description: 'Apply troubleshooting steps to resolve the issue',
                order: 4,
                durationInHours: 24,
                actions: [],
                transitions: [
                    {
                        targetStageId: 'resolution',
                        condition: { type: 'ALWAYS' },
                        name: 'Implement Solution'
                    },
                    {
                        targetStageId: 'escalation',
                        condition: { type: 'TIME_BASED', value: 24 },
                        name: 'Escalate If Not Resolved'
                    }
                ]
            },
            {
                id: 'escalation',
                name: 'Escalation',
                description: 'Escalate to higher-level support if needed',
                order: 5,
                durationInHours: 8,
                actions: [
                    {
                        type: 'ESCALATION',
                        config: {
                            escalationReason: 'Technical issue requires specialized expertise',
                            increasePriority: true
                        }
                    }
                ],
                transitions: [
                    {
                        targetStageId: 'advanced_troubleshooting',
                        condition: { type: 'ALWAYS' },
                        name: 'Begin Advanced Troubleshooting'
                    }
                ]
            },
            {
                id: 'advanced_troubleshooting',
                name: 'Advanced Troubleshooting',
                description: 'Apply specialized expertise to resolve complex issues',
                order: 6,
                durationInHours: 16,
                actions: [],
                transitions: [
                    {
                        targetStageId: 'resolution',
                        condition: { type: 'ALWAYS' },
                        name: 'Implement Solution'
                    }
                ]
            },
            {
                id: 'resolution',
                name: 'Resolution',
                description: 'Apply the solution and verify it works',
                order: 7,
                durationInHours: 8,
                actions: [
                    {
                        type: 'STATUS_UPDATE',
                        config: {
                            status: 'Resolved',
                            updateReason: 'Technical issue has been resolved'
                        }
                    }
                ],
                transitions: [
                    {
                        targetStageId: 'documentation',
                        condition: { type: 'ALWAYS' },
                        name: 'Document Solution'
                    }
                ]
            },
            {
                id: 'documentation',
                name: 'Documentation',
                description: 'Document the issue and solution for knowledge base',
                order: 8,
                durationInHours: 4,
                actions: [
                    {
                        type: 'NOTIFICATION',
                        config: {
                            notifyComplainant: true,
                            customMessage: 'Your technical support ticket has been resolved. Please let us know if you experience any further issues.'
                        }
                    }
                ],
                transitions: []
            }
        ]
    },
    {
        id: 'it-service-request',
        name: 'IT Service Request',
        description: 'Process for handling new service requests and installations',
        category: TEMPLATE_CATEGORIES.IT_SUPPORT,
        icon: 'server',
        stages: [
            {
                id: uuidv4(),
                name: 'Request Reception',
                description: 'Receive and categorize the service request',
                order: 1,
                durationInHours: 24,
                actions: [
                    {
                        type: 'NOTIFICATION',
                        config: {
                            notifyDepartment: true
                        }
                    }
                ],
                transitions: [
                    {
                        targetStageId: 'initial_review',
                        condition: { type: 'ALWAYS' },
                        name: 'Conduct Initial Review'
                    }
                ]
            },
            {
                id: 'initial_review',
                name: 'Initial Review',
                description: 'Review service request for feasibility and requirements',
                order: 2,
                durationInHours: 48,
                actions: [
                    {
                        type: 'STATUS_UPDATE',
                        config: {
                            status: 'In Progress',
                            updateReason: 'Reviewing service request'
                        }
                    }
                ],
                transitions: [
                    {
                        targetStageId: 'approval',
                        condition: { type: 'ALWAYS' },
                        name: 'Seek Approval'
                    }
                ]
            },
            {
                id: 'approval',
                name: 'Request Approval',
                description: 'Obtain necessary approvals for the service',
                order: 3,
                durationInHours: 72,
                actions: [],
                transitions: [
                    {
                        targetStageId: 'resource_allocation',
                        condition: { type: 'ALWAYS' },
                        name: 'Allocate Resources'
                    }
                ]
            },
            {
                id: 'resource_allocation',
                name: 'Resource Allocation',
                description: 'Allocate necessary resources for the service',
                order: 4,
                durationInHours: 48,
                actions: [],
                transitions: [
                    {
                        targetStageId: 'scheduling',
                        condition: { type: 'ALWAYS' },
                        name: 'Schedule Implementation'
                    }
                ]
            },
            {
                id: 'scheduling',
                name: 'Implementation Scheduling',
                description: 'Schedule the service implementation',
                order: 5,
                durationInHours: 24,
                actions: [
                    {
                        type: 'NOTIFICATION',
                        config: {
                            notifyComplainant: true,
                            customMessage: 'Your service request has been scheduled for implementation. You will be notified of the specific date and time.'
                        }
                    }
                ],
                transitions: [
                    {
                        targetStageId: 'implementation',
                        condition: { type: 'ALWAYS' },
                        name: 'Begin Implementation'
                    }
                ]
            },
            {
                id: 'implementation',
                name: 'Service Implementation',
                description: 'Implement the requested service',
                order: 6,
                durationInHours: 72,
                actions: [],
                transitions: [
                    {
                        targetStageId: 'testing',
                        condition: { type: 'ALWAYS' },
                        name: 'Test Implementation'
                    }
                ]
            },
            {
                id: 'testing',
                name: 'Testing',
                description: 'Test the implemented service for functionality',
                order: 7,
                durationInHours: 24,
                actions: [],
                transitions: [
                    {
                        targetStageId: 'user_training',
                        condition: { type: 'ALWAYS' },
                        name: 'Provide User Training'
                    }
                ]
            },
            {
                id: 'user_training',
                name: 'User Training',
                description: 'Provide training for the new service if necessary',
                order: 8,
                durationInHours: 48,
                actions: [],
                transitions: [
                    {
                        targetStageId: 'closure',
                        condition: { type: 'ALWAYS' },
                        name: 'Close Service Request'
                    }
                ]
            },
            {
                id: 'closure',
                name: 'Request Closure',
                description: 'Complete the service request',
                order: 9,
                durationInHours: 24,
                actions: [
                    {
                        type: 'STATUS_UPDATE',
                        config: {
                            status: 'Resolved',
                            updateReason: 'Service has been implemented successfully'
                        }
                    },
                    {
                        type: 'NOTIFICATION',
                        config: {
                            notifyComplainant: true,
                            customMessage: 'Your requested IT service has been successfully implemented. Please let us know if you need any additional assistance.'
                        }
                    }
                ],
                transitions: []
            }
        ]
    },
    {
        id: 'it-security-incident',
        name: 'Security Incident Response',
        description: 'Process for handling IT security incidents',
        category: TEMPLATE_CATEGORIES.IT_SUPPORT,
        icon: 'shield',
        stages: [
            {
                id: uuidv4(),
                name: 'Incident Detection',
                description: 'Detect and initially assess the security incident',
                order: 1,
                durationInHours: 4,
                actions: [
                    {
                        type: 'NOTIFICATION',
                        config: {
                            notifyDepartment: true
                        }
                    },
                    {
                        type: 'ASSIGNMENT',
                        config: {
                            assignmentType: 'AUTO',
                            findAvailableUser: true
                        }
                    }
                ],
                transitions: [
                    {
                        targetStageId: 'initial_response',
                        condition: { type: 'ALWAYS' },
                        name: 'Initiate Response'
                    }
                ]
            },
            {
                id: 'initial_response',
                name: 'Initial Response',
                description: 'Immediate actions to contain the security incident',
                order: 2,
                durationInHours: 4,
                actions: [
                    {
                        type: 'STATUS_UPDATE',
                        config: {
                            status: 'In Progress',
                            updateReason: 'Initial security response underway'
                        }
                    }
                ],
                transitions: [
                    {
                        targetStageId: 'containment',
                        condition: { type: 'ALWAYS' },
                        name: 'Contain Incident'
                    }
                ]
            },
            {
                id: 'containment',
                name: 'Containment',
                description: 'Contain the security incident to prevent further damage',
                order: 3,
                durationInHours: 8,
                actions: [],
                transitions: [
                    {
                        targetStageId: 'investigation',
                        condition: { type: 'ALWAYS' },
                        name: 'Begin Investigation'
                    }
                ]
            },
            {
                id: 'investigation',
                name: 'Investigation',
                description: 'Investigate the cause and impact of the security incident',
                order: 4,
                durationInHours: 24,
                actions: [],
                transitions: [
                    {
                        targetStageId: 'eradication',
                        condition: { type: 'ALWAYS' },
                        name: 'Begin Eradication'
                    }
                ]
            },
            {
                id: 'eradication',
                name: 'Eradication',
                description: 'Remove the source of the security incident',
                order: 5,
                durationInHours: 16,
                actions: [],
                transitions: [
                    {
                        targetStageId: 'recovery',
                        condition: { type: 'ALWAYS' },
                        name: 'Begin Recovery'
                    }
                ]
            },
            {
                id: 'recovery',
                name: 'Recovery',
                description: 'Restore affected systems to normal operation',
                order: 6,
                durationInHours: 24,
                actions: [],
                transitions: [
                    {
                        targetStageId: 'lessons_learned',
                        condition: { type: 'ALWAYS' },
                        name: 'Conduct Lessons Learned'
                    }
                ]
            },
            {
                id: 'lessons_learned',
                name: 'Lessons Learned',
                description: 'Document lessons learned from the incident',
                order: 7,
                durationInHours: 16,
                actions: [],
                transitions: [
                    {
                        targetStageId: 'closure',
                        condition: { type: 'ALWAYS' },
                        name: 'Close Incident'
                    }
                ]
            },
            {
                id: 'closure',
                name: 'Incident Closure',
                description: 'Close the security incident',
                order: 8,
                durationInHours: 8,
                actions: [
                    {
                        type: 'STATUS_UPDATE',
                        config: {
                            status: 'Resolved',
                            updateReason: 'Security incident has been resolved'
                        }
                    },
                    {
                        type: 'NOTIFICATION',
                        config: {
                            notifyComplainant: true,
                            customMessage: 'The security incident has been resolved. Enhanced security measures have been implemented to prevent similar incidents in the future.'
                        }
                    }
                ],
                transitions: []
            }
        ]
    }
];

// Combine all templates for easy lookup
const allTemplates = [
    ...basicTemplates,
    ...academicTemplates,
    ...administrativeTemplates,
    ...facilitiesTemplates,
    ...itSupportTemplates
];

export default workflowTemplateService;