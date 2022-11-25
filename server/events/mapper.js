module.exports = {
    "@events/discordMessageCreated": [
      "@listeners/setDiscordLinkNotification"
    ],
    "@events/projectCreated": [
      "@listeners/sendProjectCreateNotification"
    ],
    "@events/memberInvitedToProject": [
      "@listeners/sendMemberInviteNotification"
    ],
    "@events/projectDeleted": [
      "@listeners/sendProjectDeleteNotification"
    ],
    "@events/projectMemberRemoved": [
      "@listeners/sendProjectRemovedNotification"
    ],
    "@events/taskCreated": [
      "@listeners/sendTaskCreatedNotification"
    ],
    "@events/taskAssigned": [
      "@listeners/sendTaskAssignedNotification"
    ],
    "@events/taskApplied": [
      "@listeners/sendTaskAppliedNotification"
    ],
    "@events/taskSubmitted": [
      "@listeners/sendTaskSubmittedNotification"
    ],
    "@events/taskSubmissionApprove": [
      "@listeners/sendTaskSubmissionApproveNotification"
    ]
}