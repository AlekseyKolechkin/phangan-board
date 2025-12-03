import {BrowserRouter, Link, Route, Routes} from 'react-router-dom';
import {HomePage} from '@/pages/HomePage';
import {PostAdPage} from '@/pages/PostAdPage';
import {EditAdPage} from '@/pages/EditAdPage';
import {AdDetailPage} from '@/pages/AdDetailPage';
import {LanguageSwitcher} from '@/components/LanguageSwitcher';

function App() {

    return (
        <BrowserRouter>
            <div className="min-h-screen bg-gray-50">
                <header className="bg-white shadow">
                    <div className="max-w-7xl mx-auto py-6 px-4 flex items-center justify-between">
                        <Link to="/">
                            <h1 className="text-3xl font-bold text-gray-900">
                                Phangan Board
                            </h1>
                        </Link>
                        <LanguageSwitcher/>
                    </div>
                </header>

                <Routes>
                    <Route path="/" element={<HomePage/>}/>
                    <Route path="/ad/:id" element={<AdDetailPage/>}/>
                    <Route path="/post" element={<PostAdPage/>}/>
                    <Route path="/edit/:token" element={<EditAdPage/>}/>
                </Routes>
            </div>
        </BrowserRouter>
    );
}

export default App;
