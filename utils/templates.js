import config from 'config'

const HOST = config.get('host-url')

export const googleAuthSubject = 'В Ваш аккаунт был выполнен вход через Google'
export const facebookAuthSubject = 'В Ваш аккаунт был выполнен вход через Facebook'
export const registrationCompletedSubject = 'Вы успешно зарегистрировались!'
export const resetPasswordSubject = 'Ключ сброса Вашего пароля'
export const inviteUserMemberSubject = 'Вас пригласила компания'
export const applyInviteUserMemberSubject = 'Пользователь принял приглашение'
export const rejectInviteUserMemberSubject = 'Пользователь отклонил приглашение'
export const appointUserMemberSubject = 'Вас назначили ответственным'
export const excludeUserMemberSubject = 'С вас сняли полномочия'
export const dismissUserMemberSubject = 'Вас исключили из компании'
export const deleteUserSubject = 'Ваш аккаунт был удален'

export const attentionAuthTemplate = `
  <p>
    В Ваш аккаунт был выполнен вход. Если это не Вы, убедительная просьба, <a href="${HOST}/auth">сбросить пароль</a> или <a href="${HOST}/support">обратиться</a> в техническую поддержку
  </p>
`

export const googleAuth = ({ name }) => {
  return `
    <h1>${name}, в Ваш аккаунт был выполнен вход через Google</h1>
    ${attentionAuthTemplate}
  `
}

export const facebookAuth = ({ name }) => {
  return `
    <h1>${name}, в Ваш аккаунт был выполнен вход через Facebook</h1>
    ${attentionAuthTemplate}
  `
}

export const registrationCompleted = ({ name }) => {
  return `
    <h1>${name}, поздравляем с регистрацией!</h1>
  `
}

export const resetPassword = ({ key }) => {
  return `
    <h1>Используйте этот ключ для сброса пароля</h1>
    <b>${key}</b>
  `
}

export const inviteUserMember = ({ message }) => {
  return `
    <h1>${message}</h1>
    <a href="${HOST}/profile?notifications">Ответить</a>
  `
}

export const applyInviteUserMember = ({ message }) => {
  return `
    <h1>${message}</h1>
  `
}

export const rejectInviteUserMember = ({ message }) => {
  return `
    <h1>${message}</h1>
  `
}

export const appointUserMember = ({ message }) => {
  return `
    <h1>${message}</h1>
  `
}

export const excludeUserMember = ({ message }) => {
  return `
    <h1>${message}</h1>
  `
}

export const dismissUserMember = ({ message }) => {
  return `
    <h1>${message}</h1>
  `
}

export const deleteUser = () => {
  return `
    <h1>К сожалению, Ваш аккаунт был удален</h1>
    <p>Причины удаления аккаунта можно узнать, <a href="${HOST}/support">обратившись</a> в техническую поддержку</p>
  `
}

export default {
  googleAuthSubject,
  facebookAuthSubject,
  registrationCompletedSubject,
  resetPasswordSubject,
  inviteUserMemberSubject,
  applyInviteUserMemberSubject,
  rejectInviteUserMemberSubject,
  appointUserMemberSubject,
  excludeUserMemberSubject,
  dismissUserMemberSubject,
  deleteUserSubject,
  googleAuth,
  facebookAuth,
  registrationCompleted,
  resetPassword,
  inviteUserMember,
  applyInviteUserMember,
  rejectInviteUserMember,
  appointUserMember,
  excludeUserMember,
  dismissUserMember,
  deleteUser
}
