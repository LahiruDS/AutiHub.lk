/**
 * Notification delivery. Email goes through SMTP (nodemailer), SMS goes through
 * a generic webhook so you can point it at Twilio / Msg91 / Dialog without
 * touching any business logic. If credentials are missing the message is only
 * stored in-app, so the app never breaks in development.
 */
import nodemailer from 'nodemailer'
import config from '../config/env.js'
import Notification from '../models/Notification.js'

let mailer = null

const getMailer = () => {
  if (mailer) return mailer
  if (!config.notifications.smtp.host) return null
  mailer = nodemailer.createTransport({
    host: config.notifications.smtp.host,
    port: config.notifications.smtp.port,
    secure: config.notifications.smtp.port === 465,
    auth: config.notifications.smtp.user
      ? { user: config.notifications.smtp.user, pass: config.notifications.smtp.pass }
      : undefined
  })
  return mailer
}

const deliverEmail = async ({ to, subject, text }) => {
  const transport = getMailer()
  if (!transport) return { skipped: true, reason: 'SMTP not configured' }

  await transport.sendMail({ from: config.notifications.fromEmail, to, subject, text })
  return { sent: true }
}

const deliverSms = async ({ to, message }) => {
  if (!config.notifications.smsWebhookUrl) {
    return { skipped: true, reason: 'SMS webhook not configured' }
  }

  const response = await fetch(config.notifications.smsWebhookUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(config.notifications.smsApiKey
        ? { Authorization: `Bearer ${config.notifications.smsApiKey}` }
        : {})
    },
    body: JSON.stringify({ to, message })
  })

  if (!response.ok) throw new Error(`SMS gateway responded ${response.status}`)
  return { sent: true }
}

/** Always writes an in-app notification, then best-effort sends email / SMS. */
export const notifyUser = async ({ user, station = null, booking = null, type, title, body }) => {
  const channels = ['in_app']
  if (user.notifications?.email) channels.push('email')
  if (user.notifications?.sms) channels.push('sms')

  const records = []

  for (const channel of channels) {
    const record = await Notification.create({
      recipient: user._id,
      station,
      booking,
      channel,
      type,
      title,
      body,
      status: channel === 'in_app' ? 'queued' : 'queued'
    })

    if (channel === 'in_app') {
      records.push(record)
      continue
    }

    try {
      if (channel === 'email') {
        await deliverEmail({ to: user.email, subject: title, text: `${title}\n\n${body}` })
      } else {
        await deliverSms({ to: user.phone, message: `${title} - ${body}` })
      }
      record.status = 'sent'
      record.sentAt = new Date()
    } catch (error) {
      record.status = 'failed'
      record.error = error.message
    }

    await record.save()
    records.push(record)
  }

  return records
}

export const notifyMany = async (users, payload) =>
  Promise.all(users.filter(Boolean).map((user) => notifyUser({ ...payload, user })))