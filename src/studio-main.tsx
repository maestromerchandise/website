import { createRoot } from 'react-dom/client'
import { Studio } from 'sanity'
import { createStudioConfig } from '../studio/studio-config'
import { config } from './lib/config'

/**
 * The Studio, served by the website itself at /studio.
 *
 * Its own Vite entry rather than a route, matching how About is built: the page
 * is a real file, so a refresh resolves on the server and the home page never
 * downloads the Studio bundle.
 *
 * No StrictMode here, unlike the two site entries. Sanity mounts its own
 * provider tree and the double-invoked effects StrictMode adds are noise in a
 * tool nobody is shipping to visitors.
 */
createRoot(document.getElementById('root')!).render(
  <Studio
    // Pinned to light. Left to follow the operating system, a machine in dark
    // mode opens the Studio on a dark ground and the white theme never shows.
    scheme="light"
    config={createStudioConfig({
      projectId: config.sanityProjectId,
      dataset: config.sanityDataset,
      // Matches the folder this entry builds into, and so the URL it is served
      // from. Without it the Studio router reads "studio" as a tool name.
      basePath: '/studio',
    })}
  />,
)
