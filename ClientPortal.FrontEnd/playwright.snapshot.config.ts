import { TestInfo } from '@playwright/test'

type BeforeEachInner = (args: Record<string, any>, testInfo: TestInfo) => Promise<any> | any

export const configureSnapshotPath =
  (): BeforeEachInner =>
  ({ page: _ }, testInfo: TestInfo): any => {
    const originalSnapshotPath = testInfo.snapshotPath

    testInfo.snapshotPath = snapshotName => {
      const result = originalSnapshotPath
        .apply(testInfo, [snapshotName])
        .replace('.txt', '.json')
        .replace('-chromium', '')
        .replace('-linux', '')
        .replace('-darwin', '')
        .replace('-win32', '')

      return result
    }
  }
