import type { NextAuthConfig } from 'next-auth' // 导入 NextAuthConfig 类型，用于配置 NextAuth

export const authConfig = {
  // 导出 authConfig 对象，用于配置身份验证
  pages: {
    // 配置页面
    signIn: '/login', // 登录页面路径
  },
  callbacks: {
    // 配置回调函数
    //   在路由切换的时候被调用
    authorized({ auth, request: { nextUrl } }) {
      // authorized 回调函数，用于授权访问
      const isLoggedIn = !!auth?.user // 检查用户是否已登录，将 auth?.user 强制转换为布尔值
      const isOnDashboard = nextUrl.pathname.startsWith('/dashboard') // 检查当前路径是否以 /dashboard 开头，判断是否在 dashboard 页面
      if (isOnDashboard) {
        // 如果在 dashboard 页面
        if (isLoggedIn) return true // 如果已登录，则允许访问
        return false // Redirect unauthenticated users to login page // 如果未登录，则拒绝访问，重定向到登录页面
      } else if (isLoggedIn) {
        // 如果不在 dashboard 页面，但已登录
        return Response.redirect(new URL('/dashboard', nextUrl)) // 重定向到 dashboard 页面
      }
      return true // 允许访问其他页面
    },
  },
  providers: [], // Add providers with an empty array for now // 配置 providers，目前为空数组
} satisfies NextAuthConfig // 确保 authConfig 对象符合 NextAuthConfig 类型
