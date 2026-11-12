import { TrashRepository } from '@scriptflow/database';

export class ManageTrash {
  private trashRepo: TrashRepository;

  constructor(trashRepo: TrashRepository = new TrashRepository()) {
    this.trashRepo = trashRepo;
  }

  /**
   * Restores an item from the trash
   */
  public async restoreItem(type: string, id: string): Promise<boolean> {
    return await this.trashRepo.restoreItem(type, id);
  }

  /**
   * Permanently deletes an item and cascades deletions
   */
  public async purgeItem(type: string, id: string): Promise<boolean> {
    return await this.trashRepo.purgeItem(type, id);
  }
}
