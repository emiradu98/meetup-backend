import { list, nonNull, queryField, stringArg } from 'nexus'
import { handleError } from '../../utils/helpers'
import { errors, user_status } from '../../utils/constants'
import { User } from '.prisma/client'


export const me = queryField('me', {
  type: 'User',
  async resolve(_parent, _args, ctx) {
    return await ctx.prisma.user.findUnique({
      where: {
        id: ctx.userId
      },
      include: {
        notifications: true,
        friends: {
          include: {
            friend: true
          }
        },
        reservations: {
          include: {
            table: true,
            pub: true,
            location: true,
            user: true
          }
        },
        reviews: {
          include: {
            pub: true
          }
        },
        pub: { include: { locations: true } },
        tables: {
          include: {
            reservations: {
              include: {
                user: true
              }
            },
            location: true
          }
        }
      }
    })
  }
})

export const exists = queryField('exists', {
  type: 'Exists',
  args: {
    email: nonNull(stringArg())
  },
  async resolve(_parent, { email }, ctx) {
    try {
      const user = await ctx.prisma.user.findUnique({
        where: { email: email }
      })
      if (user) {
        return { exist: true, hasPassword: !!user.password, user: { ...user, email: email } }
      } else {
        return { exist: false, user: { email: email, id: -1 } }
      }
    } catch (e) {
      handleError(errors.userAlreadyExists)
    }
  }
})

export const findUsers = queryField('findUsers', {
  type: list('User'),
  args: {
    email: nonNull(stringArg())
  },
  async resolve(_parent, { email }, ctx) {
    try {
      const users = await ctx.prisma.user.findMany()
      return users.filter((user: User) => {
        return user.email.startsWith(email) && user.id !== ctx.userId && user.status === user_status.client
      })
    } catch (e) {
      console.log(e)
      handleError(errors.userAlreadyExists)
    }
  }
})

export const findFriends = queryField('findFriends', {
  type: list('Friend'),
  async resolve(_parent, _args , ctx) {
    try {
      return await ctx.prisma.friend.findMany({
        where: {userId: ctx.userId},
        include: {
          friend: true
        }
      })
    } catch (e) {
      console.log(e)
      handleError(errors.userAlreadyExists)
    }
  }
})
