'use server';

import { PrismaClient } from '@prisma/client';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

const prisma = new PrismaClient();

export async function createProject(prevState: any, formData: FormData) {
  const name = formData.get('name') as string;
  const customerIdStr = formData.get('customerId') as string;

  if (!name || !customerIdStr) {
    return { error: 'Vui lòng nhập đầy đủ tên dự án và chọn khách hàng.' };
  }

  const customerId = parseInt(customerIdStr, 10);
  if (isNaN(customerId)) {
    return { error: 'Khách hàng không hợp lệ.' };
  }

  try {
    const newProject = await prisma.project.create({
      data: {
        name,
        customerId,
        status: 'draft',
        totalCost: 0,
      },
    });
    
    // Redirect directly to the project dashboard
    redirect(`/admin/projects/${newProject.id}`);
  } catch (error) {
    if ((error as any).message?.includes('NEXT_REDIRECT')) throw error;
    console.error('Error creating project:', error);
    return { error: 'Có lỗi xảy ra khi tạo dự án.' };
  }
}

export async function addProjectItem(prevState: any, formData: FormData) {
  const projectId = parseInt(formData.get('projectId') as string, 10);
  const productId = parseInt(formData.get('productId') as string, 10);
  const quantity = parseInt(formData.get('quantity') as string, 10) || 1;

  if (isNaN(projectId) || isNaN(productId)) {
    return { error: 'Thông tin không hợp lệ.' };
  }

  try {
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) return { error: 'Sản phẩm không tồn tại.' };

    await prisma.projectItem.create({
      data: {
        projectId,
        productId,
        quantity,
        price: product.price, // use default product price for now
      }
    });

    // Update total cost
    const items = await prisma.projectItem.findMany({ where: { projectId } });
    const totalCost = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    await prisma.project.update({ where: { id: projectId }, data: { totalCost } });

  } catch (error) {
    console.error('Error adding item:', error);
    return { error: 'Có lỗi xảy ra khi thêm sản phẩm.' };
  }

  revalidatePath(`/admin/projects/${projectId}`);
  return { success: true };
}

export async function removeProjectItem(projectId: number, itemId: number) {
  try {
    await prisma.projectItem.delete({ where: { id: itemId } });
    
    // Update total cost
    const items = await prisma.projectItem.findMany({ where: { projectId } });
    const totalCost = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    await prisma.project.update({ where: { id: projectId }, data: { totalCost } });
    
    revalidatePath(`/admin/projects/${projectId}`);
    return { success: true };
  } catch (error) {
    console.error('Error removing item:', error);
    return { error: 'Lỗi khi xóa sản phẩm.' };
  }
}

export async function assignInstaller(prevState: any, formData: FormData) {
  const projectId = parseInt(formData.get('projectId') as string, 10);
  const installerId = parseInt(formData.get('installerId') as string, 10);

  if (isNaN(projectId) || isNaN(installerId)) {
    return { error: 'Thông tin không hợp lệ.' };
  }

  try {
    await prisma.projectInstaller.create({
      data: {
        projectId,
        installerId,
        status: 'assigned',
      }
    });
  } catch (error) {
    console.error('Error assigning installer:', error);
    return { error: 'Thợ lắp đặt đã được phân công hoặc có lỗi xảy ra.' };
  }

  revalidatePath(`/admin/projects/${projectId}`);
  return { success: true };
}

export async function updateProjectStatus(projectId: number, status: string) {
  try {
    await prisma.project.update({
      where: { id: projectId },
      data: { status }
    });
    revalidatePath(`/admin/projects/${projectId}`);
    return { success: true };
  } catch (error) {
    console.error('Error updating status:', error);
    return { error: 'Lỗi khi cập nhật trạng thái.' };
  }
}

import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';
import { verifyToken } from '@/lib/auth';

export async function deleteProjectSecure(prevState: any, formData: FormData) {
  const projectId = parseInt(formData.get('projectId') as string, 10);
  const password = formData.get('password') as string;

  if (isNaN(projectId) || !password) {
    return { error: 'Vui lòng nhập mật khẩu.' };
  }

  try {
    // 1. Verify current admin session
    const cookieStore = await cookies();
    const token = cookieStore.get('admin_token')?.value;
    if (!token) return { error: 'Bạn chưa đăng nhập.' };

    const payload = await verifyToken(token);
    if (!payload || !payload.id) return { error: 'Phiên đăng nhập không hợp lệ.' };

    // 2. Fetch admin user
    const adminUser = await prisma.user.findUnique({
      where: { id: payload.id as number }
    });
    if (!adminUser) return { error: 'Tài khoản không tồn tại.' };

    // 3. Verify password
    const isValid = await bcrypt.compare(password, adminUser.passwordHash);
    if (!isValid) return { error: 'Mật khẩu không chính xác. Xóa thất bại.' };

    // 4. Delete the project
    await prisma.project.delete({
      where: { id: projectId }
    });

  } catch (error) {
    console.error('Error deleting project:', error);
    return { error: 'Có lỗi xảy ra khi xóa dự án.' };
  }

  revalidatePath('/admin/projects');
  return { success: true };
}
