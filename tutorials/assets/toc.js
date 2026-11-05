/* =============================================================
   SITE TABLE OF CONTENTS — single source of truth
   -------------------------------------------------------------
   The "Bring a Barrier, Leave With a Build" workshop site (HKIS Teachers
   Teach Teachers, 2 October 2026). Built on the HKIS Biology reader
   template: course.js reads everything it generates from this file.

   chapter fields (see the Biology template's toc.js for the full list)
     id        unique slug, also used as body[data-chapter]
     file      path relative to the site root
     unit      id of an entry in COURSE.units
     title     page title ("1 Flint K12": the number goes in the sidebar gutter)
     summary   one line for search
     keywords  extra search terms not in the visible text
     time      working time, shown as a pill
     sections  number of [data-track] sections in the file, so progress can
               be counted without opening the page. Keep it in step.
     question  the one question the page answers (the progression strip)
     status    'ready', or 'planned' for a page that is not open yet: the sidebar
               shows it as Soon, links to it on other pages switch off (workshop.js),
               and its sections don't count toward progress

   unit fields
     sequence  false when the unit's pages are a list, not a sequence (the tools, in
               alphabetical order): the progression strip then marks only the page you
               are on, instead of what is done and what is ahead
     strip     the words after the unit's name in the progression strip's heading
               (default: "how the ideas build")
   ============================================================= */
window.COURSE = {
    title: 'Bring a Barrier, Leave With a Build',
    subtitle: 'Build the classroom tool nobody else will build for you',

    // The A3 handout: the Handout button in the toolbar and the foot of the sidebar.
    // (Used only when there is no COURSE.tools below.)
    handout: 'handout/Bring-a-Barrier-handout-A3.pdf',

    // Current session option; retired regional-unavailable guides are archived.
    tools: {
        default: 'flint-gemini',
        pairs: {
            'flint-gemini': { label: 'Flint + Gemini', handout: 'handout/Bring-a-Barrier-handout-A3.pdf' }
        }
    },

    // Listen's natural voices (121 MB) are borrowed from the Biology reader, which is
    // served from the same host. Anywhere else, Listen uses the device's voices.
    voiceRoot: 'https://dbbudd.github.io/biology/',

    units: [
        { id: 'session', label: 'The session', short: 'Session', hue: 210, needs: [] },
        { id: 'tools', label: 'Getting started with the tools', short: 'Tools', hue: 355, needs: ['session'], sequence: false, strip: 'the question each guide answers' },
        { id: 'publishing', label: 'App publishing', short: 'Publishing', hue: 40, needs: ['tools'] }
    ],

    chapters: [
        {
            id: 'session', file: 'index.html', unit: 'session',
            title: 'The session',
            summary: 'The whole session: the idea, why now, the question, the loop, then nine steps from the warm-up to Build 02, and where it goes next.',
            keywords: 'recursion iteration fern lungs MIT watershed thinking routines creativity algorithmic heuristic question loop warm-up creative hustle barrier deficit sketch prompt spine build test SCAMPER corners margins biology third rung',
            sims: [], time: '50 min', sections: 9, standards: [], kind: 'Overview',
            question: 'What problems do you want to solve?', status: 'ready'
        },
        {
            id: 'shortcuts', file: 'shortcuts.html', unit: 'tools',
            title: '1 Apple Shortcuts',
            summary: 'Describe a shortcut in plain words and let Apple Intelligence build it, then check it, tweak it, run it and share it. The worked example, Summarise, turns a meeting transcript into notes. A draft.',
            keywords: 'apple shortcuts apple intelligence describe a shortcut describe a change tweak use model on-device summarise transcript meeting notes automation ipad iphone mac icloud link ai',
            sims: [], time: '', sections: 6, standards: [], kind: 'Lesson',
            question: 'What could run itself, every lesson?', status: 'ready'
        },
        {
            id: 'flint', file: 'flint.html', unit: 'tools',
            title: '2 Flint K12',
            summary: 'Round 1. Log in to Flint, make an interactive or an explainer from your own materials, and push it further.',
            keywords: 'flint flintk12 sparky live simulation video explainer interactive activity microsoft sign in',
            sims: [], time: '15 min', sections: 5, standards: [], kind: 'Lesson',
            question: 'What can you build when your materials are the boundary?', status: 'ready'
        },
        {
            id: 'gemini', file: 'gemini.html', unit: 'tools',
            title: '3 Gemini',
            summary: 'Round 2. Build a single-screen tool in Gemini Canvas from your prompt spine, test it, share it, and push it further.',
            keywords: 'gemini canvas google vibe coding app html javascript share classroom drive prompt spine',
            sims: [], time: '20 min', sections: 5, standards: [], kind: 'Lesson',
            question: 'What can you build when the behaviour is yours to design?', status: 'ready'
        },
        {
            id: 'xcode', file: 'xcode.html', unit: 'tools',
            title: '4 Xcode',
            summary: 'Open Xcode’s Intelligence settings and try the agent configured for the workshop. Regional agent setup instructions will be added next.',
            keywords: 'xcode swift swiftui ipad app settings intelligence agents deepseek grok coding assistant simulator developer mode apple school manager',
            sims: [], time: '', sections: 3, standards: [], kind: 'Lesson',
            question: 'How do you use the workshop’s configured agent in Xcode?', status: 'ready'
        },
        {
            id: 'github-pages', file: 'github-pages.html', unit: 'publishing',
            title: '1 GitHub Pages',
            summary: 'Publish a classroom tool as a free website from a GitHub repository, and keep it up to date with GitHub Desktop.',
            keywords: 'github pages publish website repository index.html free link deploy github desktop commit push clone',
            sims: [], time: '', sections: 6, standards: [], kind: 'Lesson',
            question: 'How do students open what you built?', status: 'ready'
        },
        {
            id: 'vercel', file: 'vercel.html', unit: 'publishing',
            title: '2 Vercel',
            summary: 'Why you might publish with Vercel instead of GitHub Pages, then put a tool online by dragging in its folder, and connect GitHub so changes go live by themselves with a preview link first. A draft.',
            keywords: 'vercel deploy drop folder web app github preview link hosting hobby plan non-commercial function environment variable secret key api key data preferences ai training private repository custom domain',
            sims: [], time: '30 min', sections: 7, standards: [], kind: 'Lesson',
            question: 'How does a growing tool stay live while you change it?', status: 'ready'
        },
        {
            id: 'app-store', file: 'app-store.html', unit: 'publishing',
            title: '3 App Store',
            summary: 'Publish an app made in Xcode: the Apple Developer Program, App Store Connect, TestFlight and App Review.',
            keywords: 'app store apple developer program app store connect testflight app review publish ipad',
            sims: [], time: '', sections: 5, standards: [], kind: 'Lesson',
            question: 'What does it take to put an app in students’ hands?', status: 'ready'
        }
    ],

    standards: {},

    // Words with a dotted underline on the pages (<span class="term">). Hover or tap shows these.
    glossary: {
        'Recursion': 'Applying a rule to its own output, again and again, so each round starts from what the last one made. It builds a fern and the branches of your lungs. When each round also responds to what is around it, things adapt: plants and animals to where they live, an AI model to what it is scored on, your tool to your students.',
        'Algorithmic problem': 'A problem with a known procedure: follow the steps and you get the answer. AI is now very good at these.',
        'Heuristic problem': 'A problem with no reliable procedure. You work on it with rules of thumb, judgment and trial, and you know you have arrived when you look at the result.',
        'Deficit': 'A description that puts the problem in the student: "They can’t organise their writing." It names what the student lacks.',
        'Barrier': 'A description that puts the problem in the task or the design: "The organising has to happen in their head at the same time as the writing." A barrier is something a teacher can change.',
        'Prompt': 'The instructions you type for an AI tool. A good prompt says who the tool is for, what they see first, what they can do, the language level and what to leave out.',
        'Prompt spine': 'The fill-in-the-blanks prompt from the session: Build a single-screen tool for a Grade ___ student who ___. Show ___ first, then let them ___. Keep the language at ___. No sign-in.',
        'Vibe coding': 'Making software by describing what you want in plain language, letting an AI write the code, then testing it and asking for changes. You judge the result by using it, not by reading the code.',
        'App': 'Anything you open and use. It doesn’t need to be in an App Store.',
        'HTML': 'The structure. Boxes, text, where things sit.',
        'JavaScript': 'The behaviour. What happens when you press the thing.',
        'Live simulation': 'A Flint option that builds an interactive with controls students can use. Flint marks it Experimental.',
        'Canvas': 'A Gemini workspace that writes a document or a small web app beside the chat. You try the app in Preview and ask for changes in plain language.',
        'Sparky': 'Flint’s AI tutor, which talks with students inside a Flint activity.',
        'SCAMPER': 'A creative-thinking routine for improving an idea: Substitute, Combine, Adapt, Modify, Put to another use, Eliminate, Reverse. Each word is one way to change one thing.',
        'Thinking routine': 'A short set of steps, used again and again, that shapes how students think, such as See, Think, Wonder.',
        'Coding agent': 'An AI that works on a project’s files by itself, step by step: it writes code, runs it and fixes what breaks, checking with you as it goes.',
        'Swift': 'Apple’s programming language for apps on iPhone, iPad and Mac.',
        'Repository': 'A project’s folder on GitHub: its files, and the history of every change made to them.',
        'App Store Connect': 'Apple’s website for an app on the App Store: its store page, its builds, testing and review.',
        'TestFlight': 'Apple’s way to try an app before it is on the App Store. Testers install it from an invitation.',
        'Commit': 'A saved set of changes to the files in a repository, with a short note saying what changed.',
        'Push': 'To send your commits from your computer to GitHub, so the repository, and any site published from it, has your changes.',
        'Apple Intelligence': 'Apple’s AI, built into recent iPhones, iPads and Macs. A smaller model runs on the device itself; larger ones run on Apple’s servers, called Private Cloud Compute.'
    }
};
