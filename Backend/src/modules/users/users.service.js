import { UsersRepository } from './users.repository.js'
import bcrypt from 'bcryptjs'
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../../utils/jwt.js'

const repo = new UsersRepository()

export class UsersService {
  async getAll(query) {
    return repo.findAll(query)
  }

  async getById(id) {
    const item = await repo.findById(id)
    if (!item) {
      const err = new Error('Không tìm thấy users')
      err.status = 404
      throw err
    }
    return item
  }

  async create(data) {
    if (data.password) {
      data.password = await bcrypt.hash(data.password, 10)
    }
    return repo.create(data)
  }

  async update(id, data) {
    await this.getById(id) // throws 404 if not found
    if (data.password) {
      data.password = await bcrypt.hash(data.password, 10)
    }
    return repo.update(id, data)
  }

  async delete(id) {
    await this.getById(id)
    return repo.delete(id)
  }

  async login(email, password) {
    const user = await repo.findByEmail(email)
    if (!user) {
      const err = new Error('Email hoặc mật khẩu không đúng')
      err.status = 401
      throw err
    }
    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) {
      const err = new Error('Email hoặc mật khẩu không đúng')
      err.status = 401
      throw err
    }
    const payload = { id: user.id, email: user.email, role: user.role }
    const accessToken = generateAccessToken(payload)
    const refreshToken = generateRefreshToken(payload)
    const { password: _, ...userWithoutPassword } = user.toJSON()
    return { user: userWithoutPassword, accessToken, refreshToken }
  }

  async refresh(refreshToken) {
    try {
      const decoded = verifyRefreshToken(refreshToken)
      const user = await repo.findById(decoded.id)
      if (!user) throw new Error('User không tồn tại')
      const payload = { id: user.id, email: user.email, role: user.role }
      return { accessToken: generateAccessToken(payload) }
    } catch {
      const err = new Error('Refresh token không hợp lệ hoặc đã hết hạn')
      err.status = 401
      throw err
    }
  }
}
