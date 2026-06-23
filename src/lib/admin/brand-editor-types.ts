export type EditorBrand = {
  id: string;
  name: string;
  slug: string;
  website: string;
  logoUrl: string;
  isActive: boolean;
};

export function blankEditorBrand(): EditorBrand {
  return { id: "", name: "", slug: "", website: "", logoUrl: "", isActive: true };
}
