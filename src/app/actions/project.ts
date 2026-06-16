'use server';

import { PrismaClient } from '@prisma/client';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

const prisma = new PrismaClient();

export async function createProject(prevState: any, formData: FormData) {
  const name = formData.get('name') as string;
  const customerIdStr = formData.get('customerId') as string;

  if (!name) {
    return { error: 'Vui lòng nhập tên dự án.' };
  }

  let customerId: number | null = null;
  if (customerIdStr) {
    customerId = parseInt(customerIdStr, 10);
    if (isNaN(customerId)) {
      return { error: 'Khách hàng không hợp lệ.' };
    }
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

export async function updateProjectCustomer(projectId: number, customerId: number | null) {
  try {
    await prisma.project.update({
      where: { id: projectId },
      data: { customerId }
    });
    revalidatePath(`/admin/projects/${projectId}`);
    return { success: true };
  } catch (error) {
    console.error('Error updating project customer:', error);
    return { error: 'Lỗi khi cập nhật khách hàng.' };
  }
}

export async function addProjectItem(prevState: any, formData: FormData) {
  const projectId = parseInt(formData.get('projectId') as string, 10);
  const productId = parseInt(formData.get('productId') as string, 10);
  const quantity = parseInt(formData.get('quantity') as string, 10) || 1;

  const supplierIdRaw = formData.get('supplierId') as string;
  const supplierId = supplierIdRaw ? (parseInt(supplierIdRaw, 10) || null) : null;

  if (isNaN(projectId) || isNaN(productId)) {
    return { error: 'Thông tin không hợp lệ.' };
  }

  try {
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) return { error: 'Sản phẩm không tồn tại.' };

    // Get maximum sortOrder to append to end of list
    const maxItem = await prisma.projectItem.findFirst({
      where: { projectId },
      orderBy: { sortOrder: 'desc' }
    });
    const nextSortOrder = maxItem ? maxItem.sortOrder + 1 : 0;

    await prisma.projectItem.create({
      data: {
        projectId,
        productId,
        quantity,
        price: product.price,
        sortOrder: nextSortOrder,
        supplierId,
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

export async function updateProjectItem(projectId: number, itemId: number, quantity: number, price: number, supplierId: number | null) {
  try {
    await prisma.projectItem.update({
      where: { id: itemId },
      data: { quantity, price, supplierId }
    });
    
    // Update total cost
    const items = await prisma.projectItem.findMany({ where: { projectId } });
    const totalCost = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    await prisma.project.update({ where: { id: projectId }, data: { totalCost } });
    
    revalidatePath(`/admin/projects/${projectId}`);
    return { success: true };
  } catch (error) {
    console.error('Error updating project item:', error);
    return { error: 'Lỗi khi cập nhật sản phẩm.' };
  }
}

export async function assignInstaller(prevState: any, formData: FormData) {
  const projectId = parseInt(formData.get('projectId') as string, 10);
  const installerId = parseInt(formData.get('installerId') as string, 10);
  const notes = formData.get('notes') as string || null;

  if (isNaN(projectId) || isNaN(installerId)) {
    return { error: 'Thông tin không hợp lệ.' };
  }

  try {
    await prisma.projectInstaller.create({
      data: {
        projectId,
        installerId,
        status: 'assigned',
        notes,
      }
    });
  } catch (error) {
    console.error('Error assigning installer:', error);
    return { error: 'Thợ lắp đặt đã được phân công hoặc có lỗi xảy ra.' };
  }

  revalidatePath(`/admin/projects/${projectId}`);
  return { success: true };
}

export async function removeProjectInstaller(projectId: number, installerId: number) {
  try {
    await prisma.projectInstaller.delete({
      where: {
        projectId_installerId: {
          projectId,
          installerId
        }
      }
    });
    revalidatePath(`/admin/projects/${projectId}`);
    return { success: true };
  } catch (error) {
    console.error('Error removing project installer:', error);
    return { error: 'Lỗi khi gỡ nhân sự thi công.' };
  }
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

export async function renameProject(projectId: number, newName: string) {
  if (!newName || !newName.trim()) {
    return { error: 'Tên dự án không được để trống.' };
  }
  try {
    await prisma.project.update({
      where: { id: projectId },
      data: { name: newName.trim() }
    });
    revalidatePath('/admin/projects');
    revalidatePath(`/admin/projects/${projectId}`);
    return { success: true };
  } catch (error) {
    console.error('Error renaming project:', error);
    return { error: 'Lỗi khi đổi tên dự án.' };
  }
}

export async function duplicateProject(projectId: number) {
  try {
    const originalProject = await prisma.project.findUnique({
      where: { id: projectId },
      include: { items: true }
    });

    if (!originalProject) {
      return { error: 'Dự án gốc không tồn tại.' };
    }

    const duplicatedProject = await prisma.project.create({
      data: {
        name: `${originalProject.name} (Bản sao)`,
        customerId: originalProject.customerId,
        status: 'draft',
        totalCost: originalProject.totalCost,
        notes: originalProject.notes,
        monthlyBill: originalProject.monthlyBill,
        usageTime: originalProject.usageTime,
        systemType: originalProject.systemType,
        roofArea: originalProject.roofArea,
        budget: originalProject.budget,
        items: {
          create: originalProject.items.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.price,
            supplierId: item.supplierId,
            sortOrder: item.sortOrder
          }))
        }
      }
    });

    revalidatePath('/admin/projects');
    return { success: true, newProjectId: duplicatedProject.id };
  } catch (error) {
    console.error('Error duplicating project:', error);
    return { error: 'Lỗi khi nhân bản dự án.' };
  }
}

export async function reorderProjectItem(projectId: number, itemId: number, direction: 'up' | 'down') {
  try {
    const items = await prisma.projectItem.findMany({
      where: { projectId },
      orderBy: [
        { sortOrder: 'asc' },
        { id: 'asc' }
      ]
    });

    const index = items.findIndex(item => item.id === itemId);
    if (index === -1) return { error: 'Không tìm thấy sản phẩm trong dự án.' };

    if (direction === 'up' && index === 0) return { success: true }; // Already at top
    if (direction === 'down' && index === items.length - 1) return { success: true }; // Already at bottom

    const targetIndex = direction === 'up' ? index - 1 : index + 1;

    // Normalize all sortOrders to sequential integers to ensure clean swapping
    await prisma.$transaction(
      items.map((item, idx) => {
        let newSortOrder = idx;
        if (idx === index) {
          newSortOrder = targetIndex;
        } else if (idx === targetIndex) {
          newSortOrder = index;
        }
        return prisma.projectItem.update({
          where: { id: item.id },
          data: { sortOrder: newSortOrder }
        });
      })
    );

    revalidatePath(`/admin/projects/${projectId}`);
    return { success: true };
  } catch (error) {
    console.error('Error reordering item:', error);
    return { error: 'Lỗi khi sắp xếp sản phẩm.' };
  }
}


