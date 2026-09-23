import React, { useEffect } from 'react';

declare global {
  interface Window {
    disqus_config?: (this: { page?: { url?: string; identifier?: string } }) => void;
    DISQUS?: {
      reset: (options: {
        reload: boolean;
        config?: (this: { page?: { url?: string; identifier?: string } }) => void;
      }) => void;
    };
  }
}

const DISQUS_SHORTNAME = 'rockys-modern-farm';
const PAGE_URL = 'https://mgmt6110week02aaisbuildwithaistudio.vercel.app';
const PAGE_IDENTIFIER = 'home';

export const DisqusComments: React.FC = () => {
  useEffect(() => {
    const configFn = function (this: { page?: { url?: string; identifier?: string } }) {
      if (!this.page) {
        this.page = {};
      }
      this.page.url = PAGE_URL;
      this.page.identifier = PAGE_IDENTIFIER;
    };

    window.disqus_config = configFn;

    try {
      if (window.DISQUS && typeof window.DISQUS.reset === 'function') {
        window.DISQUS.reset({
          reload: true,
          config: configFn,
        });
      } else if (!document.getElementById('disqus-script')) {
        const script = document.createElement('script');
        script.id = 'disqus-script';
        script.src = `https://${DISQUS_SHORTNAME}.disqus.com/embed.js`;
        script.setAttribute('data-timestamp', String(Date.now()));
        script.async = true;
        script.onerror = () => {
          console.warn('Disqus embed script could not be loaded.');
        };
        (document.head || document.body).appendChild(script);
      }
    } catch (err) {
      console.warn('Disqus initialization error:', err);
    }
  }, []);

  return (
    <section
      id="feedback"
      aria-label="Feedback and Comments"
      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-6 shadow-sm"
    >
      <div className="mb-4">
        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
          Visitor Feedback
        </h3>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
          Tell us what worked for you and what did not — your feedback helps us improve.
        </p>
      </div>

      <div id="disqus_thread" className="min-h-[160px]" />
      <noscript>
        Please enable JavaScript to view the comments powered by Disqus.
      </noscript>
    </section>
  );
};
