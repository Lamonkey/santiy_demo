import { defineConfig } from 'sanity'
import { structureTool } from 'sanity/structure'
import { visionTool } from '@sanity/vision'
import { schemaTypes } from './src/sanity/schemaTypes'
import { structure } from './src/sanity/structure'
import { ApproveTranslationAction, RetranslateAction } from './src/sanity/actions/translationActions'
import { GenerateSeoAction } from './src/sanity/actions/generateSeoAction'
import { TranslateLandingPageAction } from './src/sanity/actions/landingPageActions'

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET!

export default defineConfig({
  basePath: '/studio',
  projectId,
  dataset,
  schema: { types: schemaTypes },
  plugins: [
    structureTool({ structure }),
    visionTool(),
  ],
  document: {
    actions: (prev, context) => {
      if (context.schemaType === 'post') {
        return [...prev, ApproveTranslationAction, RetranslateAction, GenerateSeoAction]
      }
      if (context.schemaType === 'landingPage') {
        return [...prev, TranslateLandingPageAction, GenerateSeoAction]
      }
      return prev
    },
  },
})
