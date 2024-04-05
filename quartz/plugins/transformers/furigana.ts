import MarkdownIt from 'markdown-it';
import MarkdownItRuby from 'markdown-it-ruby';
import { QuartzTransformerPlugin } from '../types';

interface FuriganaOptions {
  ruby: MarkdownItRuby.Options;
}

export const Furigana: QuartzTransformerPlugin<FuriganaOptions> = (
  options?: FuriganaOptions
) => {
  const md = new MarkdownIt();

  // Register markdown-it-ruby plugin with specified options
  if (options && options.ruby) {
    md.use(MarkdownItRuby, options.ruby);
  } else {
    md.use(MarkdownItRuby);
  }

  return {
    name: 'Furigana',
    markdownToHtml(markdown) {
      return md.render(markdown);
    },
    externalResources() {
      return {};
    },
  };
};

