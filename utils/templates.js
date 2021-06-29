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
    В Ваш аккаунт был выполнен вход. Если это не Вы, убедительная просьба, <a href="${HOST}/reset-password">сбросить пароль</a> или <a href="${HOST}/support">обратиться</a> в техническую поддержку
  </p>
`

export const footer = `
  <br />
  <p style="font-size: 12px">Пожалуйста, не отвечайте на это письмо, так как оно сгенерировано автоматически.</p> 
`

export const googleAuth = ({ name }) => {
  return `
    <h1>${name}, в Ваш аккаунт был выполнен вход через Google</h1>
    ${attentionAuthTemplate}
    ${footer}
  `
}

export const facebookAuth = ({ name }) => {
  return `
    <h1>${name}, в Ваш аккаунт был выполнен вход через Facebook</h1>
    ${attentionAuthTemplate}
    ${footer}
  `
}

export const registrationCompleted = ({ name }) => {
  return `
    <h1>${name}, поздравляем с регистрацией!</h1>
    ${footer}
  `
}

export const resetPassword = ({ key }) => {
  return `
    <h1>Используйте этот ключ для сброса пароля</h1>
    <b>${key}</b>
    ${footer}
  `
}

export const inviteUserMember = ({ message }) => {
  return `
    <h1>${message}</h1>
    <a href="${HOST}/profile?notifications">Ответить</a>
    ${footer}
  `
}

export const applyInviteUserMember = ({ message }) => {
  return `
    <h1>${message}</h1>
    ${footer}
  `
}

export const rejectInviteUserMember = ({ message }) => {
  return `
    <h1>${message}</h1>
    ${footer}
  `
}

export const appointUserMember = ({ message }) => {
  return `
    <h1>${message}</h1>
    ${footer}
  `
}

export const excludeUserMember = ({ message }) => {
  return `
    <h1>${message}</h1>
    ${footer}
  `
}

export const dismissUserMember = ({ message }) => {
  return `
    <h1>${message}</h1>
    ${footer}
  `
}

export const deleteUser = () => {
  return `
    <h1>К сожалению, Ваш аккаунт был удален</h1>
    <p>Причины удаления аккаунта можно узнать, <a href="${HOST}/support">обратившись</a> в техническую поддержку</p>
    ${footer} 
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
