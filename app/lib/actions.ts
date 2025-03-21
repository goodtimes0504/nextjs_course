// 告诉服务器只在服务器端运行
'use server'
// 导入 Zod 库用于模式验证
import { z } from 'zod'
import postgres from 'postgres'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
const sql = postgres(process.env.POSTGRES_URL!, { ssl: 'require' })
// 使用 Zod 定义表单数据的模式
const FormSchema = z.object({
  // 发票 ID
  id: z.string(),
  // 客户 ID
  customerId: z.string({
    invalid_type_error: 'Please select a customer.',
  }),
  // 发票金额，强制转换为数字
  amount: z.coerce
    .number()
    .gt(0, { message: 'Please enter an amount greater than $0.' }),
  // 发票状态，可以是 'pending' 或 'paid'
  status: z.enum(['pending', 'paid'], {
    invalid_type_error: 'Please select an invoice status.',
  }),
  // 发票日期
  date: z.string(),
})
export type State = {
  errors?: {
    customerId?: string[]
    amount?: string[]
    status?: string[]
  }
  message?: string | null
}
// 创建一个用于创建发票的模式，省略 ID 和日期
const CreateInvoice = FormSchema.omit({ id: true, date: true })
// Use Zod to update the expected types
const UpdateInvoice = FormSchema.omit({ id: true, date: true })
// 用于创建发票的异步函数
export async function createInvoice(prevState: State, formData: FormData) {
  const validatedFields = CreateInvoice.safeParse({
    customerId: formData.get('customerId'),
    amount: formData.get('amount'),
    status: formData.get('status'),
  })
  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Missing Fields. Failed to Create Invoice.',
    }
  }
  const { customerId, amount, status } = validatedFields.data

  const amountInCents = amount * 100
  const date = new Date().toISOString().split('T')[0]

  try {
    await sql`
      INSERT INTO invoices (customer_id, amount, status, date)
      VALUES (${customerId}, ${amountInCents}, ${status}, ${date})
    `
  } catch (error) {
    // We'll log the error to the console for now
    console.error(error)
  }

  revalidatePath('/dashboard/invoices')
  redirect('/dashboard/invoices')
}

export async function updateInvoice(
  prevState: State,
  id: string,
  formData: FormData
) {
  const validatedFields = UpdateInvoice.safeParse({
    customerId: formData.get('customerId'),
    amount: formData.get('amount'),
    status: formData.get('status'),
  })
  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Missing Fields. Failed to Update Invoice.',
    }
  }
  const { customerId, amount, status } = validatedFields.data

  const amountInCents = amount * 100

  try {
    await sql`
        UPDATE invoices
        SET customer_id = ${customerId}, amount = ${amountInCents}, status = ${status}
        WHERE id = ${id}
      `
  } catch (error) {
    // We'll log the error to the console for now
    console.error(error)
  }

  revalidatePath('/dashboard/invoices')
  redirect('/dashboard/invoices')
}

export async function deleteInvoice(id: string) {
  throw new Error('Failed to Delete Invoice')
}
