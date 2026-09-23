import React, { useEffect } from 'react';

declare global {
  interface Window {
    disqus_config?: (this: {
      page?: { url?: string; identifier?: string };
      callbacks?: { onReady?: Array<() => void> };
    }) => void;
    DISQUS?: {
      reset: (options: {
        reload: boolean;
        config?: (this: {
          page?: { url?: string; identifier?: string };
        }) => void;
      }) => void;
    };
  }
}

const DISQUS_SHORTNAME = 'rockys-modern-farm';
const PAGE_URL = 'https://mgmt6110week02aaisbuildwithaistudio.vercel.app';
const PAGE_IDENTIFIER = 'home';

// Module-level state to ensure script is loaded only once and to gate remount resets
let isScriptInjected = false;
let hasFirstEmbedInitialized = false;

export const DisqusComments: React.FC = () => {
  useEffect(() => {
    const existingScript = document.getElementById('disqus-script');

    if (!existingScript && !isScriptInjected) {
      // 1. FIRST MOUNT:
      // Define window.disqus_config BEFORE injecting embed.js
      isScriptInjected = true;

      window.disqus_config = function () {
        this.page = this.page || {};
        this.page.url = PAGE_URL;
        this.page.identifier = PAGE_IDENTIFIER;
        this.callbacks = this.callbacks || {};
        this.callbacks.onReady = this.callbacks.onReady || [];
        this.callbacks.onReady.push(() => {
          hasFirstEmbedInitialized = true;
        });
      };

      // Inject embed.js once
      const script = document.createElement('script');
      script.id = 'disqus-script';
      script.src = `https://${DISQUS_SHORTNAME}.disqus.com/embed.js`;
      script.setAttribute('data-timestamp', String(Date.now()));
      script.async = true;

      script.addEventListener('load', () => {
        hasFirstEmbedInitialized = true;
      });

      (document.head || document.body).appendChild(script);

      // Do NOT call DISQUS.reset on first mount; standard Universal Code initializes the thread.
    } else {
      // 2. REMOUNT (user navigated tabs and returned to Overview):
      // Only call DISQUS.reset after the first embed has initialized
      const triggerReset = () => {
        if (window.DISQUS && typeof window.DISQUS.reset === 'function') {
          window.DISQUS.reset({
            reload: true,
            config: function () {
              this.page = this.page || {};
              this.page.url = PAGE_URL;
              this.page.identifier = PAGE_IDENTIFIER;
            },
          });
        }
      };

      if (hasFirstEmbedInitialized) {
        triggerReset();
      } else {
        // If the script was previously injected but still finishing its initial setup, wait until ready
        const timer = setInterval(() => {
          if (hasFirstEmbedInitialized || (window.DISQUS && typeof window.DISQUS.reset === 'function')) {
            clearInterval(timer);
            hasFirstEmbedInitialized = true;
            triggerReset();
          }
        }, 150);

        return () => clearInterval(timer);
      }
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
