declare module 'axios' {
  import * as originalAxios from 'axios';
  export interface AxiosError extends Error {
    config: any;
    code?: string;
    request?: any;
    response?: {
      data: any;
      status: number;
      headers: any;
      config: any;
    };
  }
  export default originalAxios;
}

declare module 'react-syntax-highlighter/dist/esm/styles/prism' {
  const materialDark: { [key: string]: React.CSSProperties };
  export { materialDark };
}

declare module '*.svg' {
  const content: any;
  export default content;
}

declare module '*.png' {
  const content: any;
  export default content;
}

declare module '*.jpg' {
  const content: any;
  export default content;
}

declare module '*.module.css' {
  const classes: { [key: string]: string };
  export default classes;
}

// Help with TypeScript complaining about incompatible parameter types
declare module 'react-markdown' {
  import { ComponentType } from 'react';
  
  interface ReactMarkdownProps {
    children: string;
    remarkPlugins?: any[];
    components?: {
      // Allow any props for components
      [key: string]: ComponentType<any>;
    };
  }
  
  const ReactMarkdown: ComponentType<ReactMarkdownProps>;
  export default ReactMarkdown;
} 