import { ProjectData } from '../types/editor';

const AUTOSAVE_KEY = 'mono_editor_autosave_v1';
const RECENT_PROJECTS_KEY = 'mono_editor_recent_projects_v1';

export class ProjectStorage {
  /**
   * Save project state to local autosave slot
   */
  public static saveAutosave(project: ProjectData): boolean {
    try {
      // Exclude large binary blobs from localStorage to prevent quota exhaustion
      const serializable = {
        ...project,
        updatedAt: Date.now(),
        mediaPool: project.mediaPool.map((asset) => ({
          ...asset,
          blob: undefined, // keep url or base64
        })),
      };
      localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(serializable));
      this.recordRecentProject(project.id, project.settings.name);
      return true;
    } catch (e) {
      console.warn('Autosave failed:', e);
      return false;
    }
  }

  /**
   * Load project from local autosave slot
   */
  public static loadAutosave(): ProjectData | null {
    try {
      const data = localStorage.getItem(AUTOSAVE_KEY);
      if (!data) return null;
      return JSON.parse(data) as ProjectData;
    } catch (e) {
      console.warn('Failed to load autosave:', e);
      return null;
    }
  }

  /**
   * Record to recent projects
   */
  public static recordRecentProject(id: string, name: string) {
    try {
      const list = this.getRecentProjects();
      const filtered = list.filter((p) => p.id !== id);
      filtered.unshift({ id, name, lastOpened: Date.now() });
      localStorage.setItem(RECENT_PROJECTS_KEY, JSON.stringify(filtered.slice(0, 10)));
    } catch {
      // ignore
    }
  }

  public static getRecentProjects(): { id: string; name: string; lastOpened: number }[] {
    try {
      const data = localStorage.getItem(RECENT_PROJECTS_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  /**
   * Export project file as .mono JSON download
   */
  public static exportProjectToFile(project: ProjectData) {
    const cleanProject = {
      ...project,
      exportedAt: Date.now(),
      mediaPool: project.mediaPool.map((m) => ({
        ...m,
        blob: undefined,
      })),
    };
    const jsonStr = JSON.stringify(cleanProject, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.settings.name.replace(/\s+/g, '_')}.mono`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /**
   * Import project from file
   */
  public static async importProjectFromFile(file: File): Promise<ProjectData> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const parsed = JSON.parse(e.target?.result as string);
          if (!parsed.tracks || !parsed.clips) {
            throw new Error('Invalid .mono project file');
          }
          resolve(parsed as ProjectData);
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = () => reject(new Error('File reading error'));
      reader.readAsText(file);
    });
  }
}
