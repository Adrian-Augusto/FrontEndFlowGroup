/** @typedef {'approved' | 'pending' | 'rejected'} GroupStatus */

export const GROUP_STATUS = {
  APPROVED: "approved",
  PENDING: "pending",
  REJECTED: "rejected",
};

const DEFAULT_PHOTO = "";

export const INITIAL_GROUPS = [
  {
    id: "test-featured-1",
    title: "Grupo de Teste em Destaque",
    description: "Este é um grupo de teste para verificar se a seção de destaque está funcionando corretamente.",
    link: "https://wa.me/5543984240476",
    platform: "WhatsApp",
    photo: DEFAULT_PHOTO,
    category: "Entretenimento",
    categoryId: "entretenimento",
    status: "approved",
    featured: true,
    createdAt: new Date().toISOString(),
    createdBy: {
      id: "test-user",
      name: "Usuário Teste",
      email: "test@example.com"
    }
  }
];

export { DEFAULT_PHOTO };
