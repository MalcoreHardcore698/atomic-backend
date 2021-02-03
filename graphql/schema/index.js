import { gql } from 'apollo-server-express'

export default gql`
  enum AccountType {
    ADMIN
    INDIVIDUAL
    OFICIAL
    ENTITY
  }

  enum ChatType {
    PERSONAL
    GROUP
  }

  enum StatusChatType {
    OPENED
    CLOSED
  }

  enum StatusMessageType {
    READED
    UNREADED
  }

  enum GenderType {
    MALE
    FEMALE
  }

  enum CategoryType {
    DIVISION
    TICKET
  }

  enum UserSetting {
    VERIFIED_EMAIL
    VERIFIED_PHONE
    NOTIFIED_EMAIL
  }

  enum PostStatus {
    MODERATION
    PUBLISHED
  }

  enum Permission {
    ACCESS_CLIENT
    ACCESS_DASHBOARD
    VIEW_USER
    VIEW_CATEGORY
    VIEW_ARTICLE
    VIEW_PROJECT
    VIEW_TICKET
    VIEW_ROLE
    ADD_USER
    ADD_CATEGORY
    ADD_ARTICLE
    ADD_PROJECT
    EDIT_USER
    EDIT_CATEGORY
    EDIT_ARTICLE
    EDIT_PROJECT
    DELETE_USER
    DELETE_CATEGORY
    DELETE_ARTICLE
    DELETE_PROJECT
    COMMENT_ARTICLE
    COMMENT_PROJECT
    CHATTING
  }

  type File {
    id: ID!
    size: Int!
    path: String!
    filename: String!
    updatedAt: String!
    createdAt: String!
  }

  type Image {
    id: ID!
    size: Int!
    path: String!
    filename: String!
    updatedAt: String!
    createdAt: String!
  }

  type Folder {
    id: ID!
    name: String!
    projects: [Project]!
  }

  type Chat {
    id: ID!
    type: ChatType!
    title: String!
    members: [User]!
    messages: [Message]!
    updatedAt: String!
    createdAt: String!
  }

  type UserChat {
    id: ID!
    chat: Chat!
    user: User!
    status: StatusChatType!
    updatedAt: String!
    createdAt: String!
  }

  type User {
    id: ID!
    name: String!
    about: String
    avatar: File
    company: User
    account: AccountType!
    gender: GenderType
    email: String!
    phone: String
    role: Role!
    members: Int
    folders: [Folder]
    projects: [Project]
    articles: [Article]
    likedProjects: [Project]
    subscribedProjects: [Project]
    dateOfBirth: String
    notifications: [Notice]
    settings: [UserSetting]
    token: String
    register: String
    updatedAt: String!
    createdAt: String!
  }

  type Message {
    id: ID!
    chat: Chat!
    user: User!
    text: String!
    type: StatusMessageType!
    updatedAt: String!
    createdAt: String!
  }

  type Role {
    id: ID!
    name: String!
    permissions: [Permission!]!
    updatedAt: String!
    createdAt: String!
  }

  type Notice {
    id: ID!
    author: User
    title: String!
    message: String!
    updatedAt: String!
    createdAt: String!
  }

  # Posts
  type Article {
    id: ID!
    author: User!
    title: String!
    body: String!
    preview: File
    category: Category
    comments: [Comment]
    commentCount: Int
    rating: [User]
    ratingCount: Int
    views: [User]
    viewsCount: Int
    status: PostStatus!
    updatedAt: String!
    createdAt: String!
  }

  type Project {
    id: ID!
    author: User!
    title: String!
    description: String!
    body: String!
    company: User
    preview: File
    category: Category
    presentation: String
    members: [User]
    files: [File]
    screenshots: [File]
    rating: [User]
    ratingCount: Int
    views: [User]
    viewsCount: Int
    status: PostStatus!
    updatedAt: String!
    createdAt: String!
  }

  type Category {
    id: ID!
    name: String!
    type: CategoryType!
    description: String
    updatedAt: String!
    createdAt: String!
  }

  type View {
    id: ID!
    user: User!
    updatedAt: String!
    createdAt: String!
  }

  type Comment {
    id: ID!
    user: User!
    article: Article!
    text: String!
    updatedAt: String!
    createdAt: String!
  }

  type Result {
    status: String!
    message: String!
  }

  input RegisterInput {
    name: String!
    account: AccountType!
    email: String!
    phone: String!
    password: String!
    confirmPassword: String!
  }

  input FolderInput {
    id: ID!
    name: String
  }

  input UserCreateInput {
    name: String!
    about: String
    avatar: Upload
    avatarSize: Int
    password: String!
    company: String
    account: AccountType!
    gender: GenderType
    email: String!
    phone: String!
    role: ID!
    folders: [FolderInput]
    dateOfBirth: String
    settings: [UserSetting]
  }

  input RoleCreateInput {
    name: String!
    permissions: [Permission]!
  }

  input FileCreateInput {
    path: String!
    size: Int!
    filename: String!
  }

  input ImageCreateInput {
    path: String!
    size: Int!
    filename: String!
  }

  input CategoryCreateInput {
    name: String!
    type: CategoryType!
    description: String
  }

  input ArticleCreateInput {
    title: String!
    body: String!
    preview: Upload!
    previewSize: Int!
    category: ID
    status: PostStatus
  }

  input ProjectCreateInput {
    title: String!
    description: String!
    body: String!
    preview: Upload
    previewSize: Int
    category: ID
    company: String
    presentation: String
    members: [String]
    files: [Upload]
    fileSizes: [Int]
    screenshots: [Upload]
    screenshotSizes: [Int]
    status: PostStatus!
  }

  input CommentCreateInput {
    article: ID!
    text: String!
  }

  input UserUpdateInput {
    name: String
    about: String
    avatar: Upload
    avatarSize: Int
    company: String
    account: AccountType
    gender: GenderType
    email: String
    phone: String
    role: ID
    folders: [FolderInput]
    dateOfBirth: String
    settings: [UserSetting]
  }

  input RoleUpdateInput {
    name: String
    permissions: [Permission]
  }

  input FileUpdateInput {
    path: String
    size: Int
    filename: String
  }

  input ImageUpdateInput {
    path: String
    size: Int
    filename: String
  }

  input CategoryUpdateInput {
    name: String
    type: CategoryType
    description: String
  }

  input ArticleUpdateInput {
    title: String
    body: String
    preview: Upload
    previewSize: Int
    category: ID
    status: PostStatus
  }

  input ProjectUpdateInput {
    title: String
    description: String
    body: String
    preview: Upload
    previewSize: Int
    category: ID
    company: String
    presentation: String
    members: [String]
    files: [Upload]
    fileSizes: [Int]
    screenshots: [Upload]
    screenshotSizes: [Int]
    status: PostStatus
  }

  input CommentUpdateInput {
    article: ID
    text: String
  }

  type Query {
    getRoles(offset: Int, limit: Int, search: String): [Role]!
    getUsers(
      offset: Int
      limit: Int
      search: String
      email: [String]
      search: String
      account: [AccountType]
      company: String
    ): [User]!
    getFiles(offset: Int, limit: Int, search: String): [File]!
    getImages(offset: Int, limit: Int, search: String): [Image]!
    getCategories(offset: Int, limit: Int, search: String): [Category]!
    getCategoryTypes: [CategoryType]!
    getProjects(
      offset: Int
      limit: Int
      search: String
      author: String
      member: String
      status: PostStatus
    ): [Project]!
    getProjectsByIds(projects: [ID]!, status: PostStatus): [Project]!
    getArticles(offset: Int, limit: Int, search: String, status: PostStatus): [Article]!
    getComments(offset: Int, limit: Int, search: String, id: ID!): [Comment]!
    getChatTypes: [ChatType]!
    getStatusChatTypes: [StatusChatType]!
    getAccountTypes: [AccountType]!
    getPermissions: [Permission]!
    getPostStatus: [PostStatus]!
    getUserChats: [UserChat]!
    getUserMembers(email: String!): [User]!

    getUser(email: String): User
    getChat(id: ID): Chat!
    getRole(id: ID!): Role
    getFile(id: ID!): File
    getImage(id: ID!): Image
    getArticle(id: ID!): Article
    getProject(id: ID!): Project
    getCategory(id: ID!): Category

    checkUser(search: String!): Result!
  }

  type Mutation {
    googleAuth(accessToken: String!): User!
    facebookAuth(accessToken: String!): User!
    checkin(login: String!): Boolean!
    login(login: String!, password: String!): User!
    register(input: RegisterInput): User!
    logout: Boolean!

    createUser(input: UserCreateInput!): [User]!
    createFile(file: Upload!): File!
    createImage(file: Upload!): Image!
    createRole(input: RoleCreateInput): [Role]!
    createCategory(input: CategoryCreateInput!): [Category]!
    createArticle(input: ArticleCreateInput!, status: PostStatus): [Article]!
    createProject(input: ProjectCreateInput!, status: PostStatus): [Project]!
    createComment(input: CommentCreateInput!): [Comment]!

    updateClientUser(input: UserUpdateInput!): User!
    updateUser(email: String!, input: UserUpdateInput!): [User]!
    updateRole(id: ID!, input: RoleUpdateInput!): [Role]!
    updateFile(id: ID!, file: Upload!): File!
    updateImage(id: ID!, file: Upload!): Image!
    updateCategory(id: ID!, input: CategoryUpdateInput!): [Category]!
    updateArticle(id: ID!, input: ArticleUpdateInput!, status: PostStatus): [Article]!
    updateProject(id: ID!, input: ProjectUpdateInput!, status: PostStatus): [Project]!
    updateComment(id: ID!, input: CommentUpdateInput!): [Comment]!

    deleteFile(id: ID!): Boolean!
    deleteImage(id: ID!): Boolean!
    deleteRole(id: ID!): [Role]!
    deleteUser(email: String!): [User]!
    deleteCategory(id: ID!): [Category]!
    deleteArticle(id: ID!, status: PostStatus): [Article]!
    deleteProject(id: ID!, status: PostStatus): [Project]!
    deleteComment(id: ID!): [Comment]!

    likeProject(id: ID!): User!
    deleteUserFolder(id: ID!): [Folder]!
    addUserFolder(name: String!): [Folder]!
    addUserChat(recipient: String!): Boolean
    addUserProject(project: ID!, folder: ID!): Boolean
    sendMessage(recipient: String!, text: String!): [Message]!
  }

  type Subscription {
    newArticle: Article!
    newProject: Project!
    newComment: Comment!
  }
`
