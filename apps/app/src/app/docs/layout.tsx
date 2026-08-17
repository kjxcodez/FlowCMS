import { RootProvider } from 'fumadocs-ui/provider';
import { DocsLayout } from 'fumadocs-ui/layouts/docs';
import type { ReactNode } from 'react';
import { source } from '@/lib/source';
import "fumadocs-ui/style.css";

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <RootProvider>
      <DocsLayout 
        tree={source.pageTree}
        nav={{
          title: "FlowCMS Docs",
          url: "/",
        }}
      >
        {children}
      </DocsLayout>
    </RootProvider>
  );
}
