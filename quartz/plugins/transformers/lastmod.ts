import fs from "fs"
import path from "path"
import { Repository } from "@napi-rs/simple-git"
import { QuartzTransformerPlugin } from "../types"
import chalk from "chalk"

export interface Options {
  priority: ("frontmatter" | "git" | "filesystem")[]
}

const defaultOptions: Options = {
  priority: ["frontmatter", "git", "filesystem"],
}

export function rearrangeDate(dateString: string): string {
  // Ensure dateString is a string
  const dateStringStr = String(dateString);

  // Check if dateString matches the format "DD-MM-YYYY"
  const regex = /^\d{2}-\d{2}-\d{4}$/;
  if (!regex.test(dateStringStr)) {
    // If not in the correct format, return the original string
    return dateStringStr;
  }

  // Split the date string by "-"
  const parts = dateStringStr.split("-");

  // Rearrange the parts
  const rearrangedDate = `${parts[1]}-${parts[0]}-${parts[2]}`;

  return rearrangedDate;
}



function coerceDate(fp: string, d: any): Date {
  const dt = new Date(rearrangeDate(d))
  const invalidDate = isNaN(dt.getTime()) || dt.getTime() === 0
  if (invalidDate && d !== undefined) {
    console.log(
      chalk.yellow(
        `\nWarning: found invalid date "${d}" in \`${fp}\`. Supported formats: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date#date_time_string_format`,
      ),
    )
  }

  return invalidDate ? new Date() : dt
}

type MaybeDate = undefined | string | number
export const CreatedModifiedDate: QuartzTransformerPlugin<Partial<Options> | undefined> = (
  userOpts,
) => {
  const opts = { ...defaultOptions, ...userOpts }
  return {
    name: "CreatedModifiedDate",
    markdownPlugins() {
      return [
        () => {
          let repo: Repository | undefined = undefined
          return async (_tree, file) => {
            let created: MaybeDate = undefined
            let modified: MaybeDate = undefined
            let published: MaybeDate = undefined

            const fp = file.data.filePath!
            const fullFp = path.posix.join(file.cwd, fp)

            for (const source of opts.priority) {
              if (source === "filesystem") {
                const st = await fs.promises.stat(fullFp)
                created ||= st.birthtimeMs
                modified ||= st.mtimeMs
              } else if (source === "frontmatter" && file.data.frontmatter) {
                created ||= file.data.frontmatter.date
                modified ||= file.data.frontmatter.lastmod
                modified ||= file.data.frontmatter.updated
                modified ||= file.data.frontmatter["last-modified"]
                published ||= file.data.frontmatter.publishDate
                // console.log(created, modified, published)
              } else if (source === "git") {
                if (!repo) {
                  repo = new Repository(file.cwd)
                }

                modified ||= await repo.getFileLatestModifiedDateAsync(file.data.filePath!)
              }
            }


            file.data.dates = {
              created: coerceDate(fp, created),

              modified: coerceDate(fp, modified),
              published: coerceDate(fp, published),
            }
          }
        },
      ]
    },
  }
}

declare module "vfile" {
  interface DataMap {
    dates: {
      created: Date
      modified: Date
      published: Date
    }
  }
}
