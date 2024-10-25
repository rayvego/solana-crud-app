'use client'

import { AppHero } from '../ui/ui-layout'


export default function DashboardFeature() {
  return (
    <div>
      <AppHero title="Welcome 🎉" subtitle="This is a simple CRUD operations made for learning purposes! Feel free to roam around and create some Journals 📖 on chain!" />
      <div className="max-w-xl mx-auto py-6 sm:px-6 lg:px-8 text-center">
        <div className="space-y-2">
          <p className={"rotate-180"}>Why are you reading this? Go to the Journal Page :p</p>
        </div>
      </div>
    </div>
  )
}