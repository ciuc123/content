export default function Home() {
  return (
    <main className="p-8 max-w-3xl mx-auto">
      <h1 className="text-4xl font-bold mb-2">💡 Ideas Content Engine</h1>
      <p className="text-gray-600 mb-8">Generate, research, and publish content ideas using GitHub Copilot.</p>

      <div className="space-y-6">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-200">
          <h2 className="text-xl font-semibold mb-4">🚀 Quick Start Workflow</h2>
          <div className="space-y-3">
            <div className="flex gap-3">
              <span className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold">1</span>
              <div>
                <p className="font-medium">Generate Ideas</p>
                <p className="text-sm text-gray-600">Use GitHub Copilot to generate 10 content ideas. Copy as JSON and import.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <span className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold">2</span>
              <div>
                <p className="font-medium">Select & Research</p>
                <p className="text-sm text-gray-600">Click "Take Further" on an idea, then ask Copilot for research.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <span className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold">3</span>
              <div>
                <p className="font-medium">Generate Content</p>
                <p className="text-sm text-gray-600">Use Copilot to generate LinkedIn post, blog article, and newsletter.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <span className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold">4</span>
              <div>
                <p className="font-medium">Publish</p>
                <p className="text-sm text-gray-600">Create a PR on your GitHub blog repository.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="border-l-4 border-yellow-400 pl-4 py-2 bg-yellow-50">
          <p className="text-sm"><strong>💡 Tip:</strong> This tool uses GitHub Copilot for AI. Simply copy prompts generated here and paste them into Copilot, then paste the results back.</p>
        </div>

        <div className="flex gap-4">
          <a href="/ideas" className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">Get Started →</a>
          <a href="/settings/knowledge" className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium">Settings</a>
        </div>
      </div>
    </main>
  )
}
