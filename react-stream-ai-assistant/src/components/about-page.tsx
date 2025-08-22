import React from "react";

const AboutPage: React.FC = () => (
  <div className="min-h-screen bg-gradient-to-br from-purple-100 via-white to-purple-50 flex flex-col items-center justify-center p-8">
    <div className="max-w-2xl w-full bg-white rounded-2xl shadow-lg p-8">
      <h1 className="text-3xl font-bold text-purple-700 mb-4">
        About Personalized AI Writing Assistant
      </h1>
      <p className="text-lg text-gray-700 mb-6">
        This app leverages advanced AI to help you write better, faster, and
        more creatively. Whether you're drafting emails, blog posts, business
        proposals, or creative stories, our assistant adapts to your needs and
        style.
      </p>
      <ul className="list-disc pl-6 text-gray-700 mb-6">
        <li>Powered by OpenAI and Stream Chat for real-time collaboration</li>
        <li>Secure authentication with Supabase</li>
        <li>Beautiful, modern UI built with React and Tailwind CSS</li>
        <li>Custom writing prompts and agent controls</li>
      </ul>
      <p className="text-md text-gray-600">
        Built by{" "}
        <span className="font-semibold text-purple-600">Sahil Om ji</span> and
        contributors. For feedback or support, contact{" "}
        <a
          href="mailto:houndsahil12345@gmail.com"
          className="text-purple-700 underline"
        >
          houndsahil12345@gmail.com
        </a>
        .
      </p>
    </div>
  </div>
);

export default AboutPage;
