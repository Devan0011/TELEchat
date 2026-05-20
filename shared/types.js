/**
 * Shared JSDoc contracts used by frontend and backend editors.
 *
 * @typedef {'direct'|'group'|'community'|'channel'} ChatType
 * @typedef {'owner'|'admin'|'moderator'|'member'|'muted'|'banned'} ParticipantRole
 * @typedef {'sent'|'delivered'|'seen'|'failed'} MessageStatus
 *
 * @typedef {Object} PublicUser
 * @property {string} id
 * @property {string=} email
 * @property {string=} phone
 * @property {string} username
 * @property {string=} avatar_url
 * @property {string=} bio
 * @property {boolean} is_online
 * @property {string=} last_seen_at
 *
 * @typedef {Object} Chat
 * @property {string} id
 * @property {ChatType} type
 * @property {string=} title
 * @property {string=} description
 * @property {string} created_at
 * @property {string} updated_at
 *
 * @typedef {Object} Message
 * @property {string} id
 * @property {string} chat_id
 * @property {string} sender_id
 * @property {string} content
 * @property {MessageStatus} status
 * @property {string} created_at
 * @property {string=} edited_at
 */

export {};
