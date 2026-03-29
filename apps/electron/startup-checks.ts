import { existsSync, accessSync, constants } from 'fs';
import type { App, Dialog } from 'electron';

export interface StartupDeps {
  dialog: Pick<Dialog, 'showErrorBox'>;
  app: Pick<App, 'quit'>;
}

export function checkStaticDir(staticDir: string, deps: StartupDeps): boolean {
  if (!existsSync(staticDir)) {
    console.error('[startup-error] STATIC_DIR not found:', staticDir);
    deps.dialog.showErrorBox(
      '起動エラー',
      'アプリのビルドが見つかりません。\n\nnpm run build を実行してください。'
    );
    deps.app.quit();
    return false;
  }
  return true;
}

export function checkDbWritable(dataDir: string, deps: StartupDeps): boolean {
  try {
    accessSync(dataDir, constants.W_OK);
    return true;
  } catch (err) {
    console.error('[startup-error] DB dir not writable:', { dataDir, err });
    deps.dialog.showErrorBox(
      '起動エラー',
      `データ保存先への書き込み権限がありません。\nパス: ${dataDir}`
    );
    deps.app.quit();
    return false;
  }
}
