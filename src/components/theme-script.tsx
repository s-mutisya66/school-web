// Put <ThemeScript /> inside <head> in the root layout. It sets the saved (or system) theme before the page
// paints, so a dark-mode visitor never sees a flash of the light page.
const INIT = `(function(){try{var t=localStorage.getItem("theme");if(!t){t=window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"}if(t==="dark")document.documentElement.classList.add("dark")}catch(e){}})();`;

export function ThemeScript() {
  return <script dangerouslySetInnerHTML={{ __html: INIT }} />;
}
