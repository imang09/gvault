import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Copy, ExternalLink, Archive, Heart, Search, Filter, Plus, HeartPulse, Send, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useState, useMemo } from 'react';
import { activeGames, couponCodes, terminatedGames } from '@/lib/gameData';
import { toast } from 'sonner';

/**
 * EroArchive Home Page
 * Design Philosophy: Museum Archive - Elegant minimalism with typography-driven layout
 * Color Scheme: Cream background, dark slate text, dark brown accents
 */

export default function Home() {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('all');

  // Coupon Form State
  const [showCouponForm, setShowCouponForm] = useState(false);
  const [couponForm, setCouponForm] = useState({ gameId: '', code: '', reward: '', terms: false });
  const [lastCouponSubmitTime, setLastCouponSubmitTime] = useState(0);

  // Memorialize State
  const [memorializingId, setMemorializingId] = useState<string | null>(null);
  const [memorializedGames, setMemorializedGames] = useState<Record<string, number>>({});

  // Memorial Form State
  const [showMemorialForm, setShowMemorialForm] = useState(false);
  const [memorialForm, setMemorialForm] = useState({ name: '', description: '', terms: false });
  const [lastMemorialSubmitTime, setLastMemorialSubmitTime] = useState(0);

  const handleCopyCoupon = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success(`Coupon copied: ${code}`);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // Filtering Logic
  const filteredActiveGames = useMemo(() => {
    return activeGames.filter(game => {
      const matchesSearch = game.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            game.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesGenre = selectedGenre === 'all' || game.category === selectedGenre;
      return matchesSearch && matchesGenre;
    });
  }, [searchQuery, selectedGenre]);

  const filteredCoupons = useMemo(() => {
    return couponCodes.filter(coupon => {
      const game = activeGames.find(g => g.id === coupon.gameId);
      if (!game) return false;
      const matchesSearch = game.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            coupon.code.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesGenre = selectedGenre === 'all' || game.category === selectedGenre;
      return matchesSearch && matchesGenre;
    });
  }, [searchQuery, selectedGenre]);

  // Submit Handlers (Mocking API & Bot Protection)
  const handleCouponSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponForm.gameId || !couponForm.code || !couponForm.reward) {
      toast.error('모든 필드를 입력해주세요.');
      return;
    }
    if (!couponForm.terms) {
      toast.error('스팸 방지 이용약관에 동의해주세요.');
      return;
    }

    const now = Date.now();
    // Rate Limiting: 60 seconds
    if (now - lastCouponSubmitTime < 60000) {
      toast.error('잠시 후 다시 시도해주세요. (단기간 연속 제출 방지)');
      return;
    }

    toast.info('reCAPTCHA 검증 중...', { id: 'recaptcha' });
    
    setTimeout(() => {
      setLastCouponSubmitTime(now);
      setShowCouponForm(false);
      setCouponForm({ gameId: '', code: '', reward: '', terms: false });
      toast.success('쿠폰 제보가 완료되었습니다! 관리자 승인 후 공개됩니다.', { id: 'recaptcha' });
    }, 1200);
  };

  const handleMemorialize = (gameId: string) => {
    if (memorializingId === gameId) return;
    
    setMemorializingId(gameId);
    setMemorializedGames(prev => ({
      ...prev,
      [gameId]: (prev[gameId] || 0) + 1
    }));
    
    toast.success('추모의 마음을 전달했습니다.');
    
    setTimeout(() => {
      setMemorializingId(null);
    }, 1000);
  };

  const handleMemorialSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!memorialForm.name || !memorialForm.description) {
      toast.error('모든 필드를 입력해주세요.');
      return;
    }
    if (!memorialForm.terms) {
      toast.error('스팸 방지 이용약관에 동의해주세요.');
      return;
    }

    const now = Date.now();
    // Rate Limiting: 60 seconds
    if (now - lastMemorialSubmitTime < 60000) {
      toast.error('잠시 후 다시 시도해주세요. (어뷰징 방지)');
      return;
    }

    toast.info('로봇 검증 시스템 작동 중...', { id: 'recaptcha-memorial' });
    
    setTimeout(() => {
      setLastMemorialSubmitTime(now);
      setShowMemorialForm(false);
      setMemorialForm({ name: '', description: '', terms: false });
      toast.success('추모 게임 등록이 신청되었습니다! 다수결 동의 대기열로 이동합니다.', { id: 'recaptcha-memorial' });
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-background relative">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex items-center justify-between py-4">
          <div className="flex items-center gap-3">
            <img
              src="https://d2xsxph8kpxj0f.cloudfront.net/310519663705479929/MBk9EdSGFcSkzMJe7VpsiZ/logo-erolabs-hfWYwmBiExMPSJy6gfuBW9.webp"
              alt="EroArchive Logo"
              className="h-10 w-10"
            />
            <div>
              <h1 className="text-xl font-bold text-foreground">EroArchive</h1>
              <p className="text-xs text-muted-foreground">EROLABS Coupon & Game Hub</p>
            </div>
          </div>
          <nav className="hidden gap-6 md:flex">
            <a href="#coupons" className="text-sm font-medium hover:text-primary transition-colors">
              쿠폰
            </a>
            <a href="#games" className="text-sm font-medium hover:text-primary transition-colors">
              게임
            </a>
            <a href="#memorial" className="text-sm font-medium hover:text-primary transition-colors">
              추모
            </a>
          </nav>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section className="relative overflow-hidden border-b-4 border-primary bg-secondary/10">
          <div
            className="absolute inset-0 opacity-15"
            style={{
              backgroundImage:
                'url(https://d2xsxph8kpxj0f.cloudfront.net/310519663705479929/MBk9EdSGFcSkzMJe7VpsiZ/hero-background-9VNuQzQYbcaGPjn8DZLAX2.webp)',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          />
          <div className="container relative py-20 text-center">
            <div className="mb-4 inline-block">
              <div className="text-xs uppercase tracking-widest text-primary font-semibold mb-2">
                EROLABS 아카이브
              </div>
            </div>
            {/* Removed the "게임의 역사를 기록하다" h2 tag per user request */}
            <p className="mx-auto mb-10 max-w-2xl text-xl text-foreground font-medium leading-relaxed">
              모든 게임 정보와 최신 쿠폰을 쉽고 빠르게 검색하세요.
            </p>
            
            {/* Search and Filter UI */}
            <div className="max-w-3xl mx-auto bg-card rounded-2xl shadow-xl border border-border p-4 flex flex-col md:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="게임 이름 또는 쿠폰 코드 검색..."
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="relative w-full md:w-48">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <select
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-border bg-background appearance-none focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
                  value={selectedGenre}
                  onChange={(e) => setSelectedGenre(e.target.value)}
                >
                  <option value="all">모든 장르</option>
                  <option value="male-oriented">남성향</option>
                  <option value="female-oriented">여성향</option>
                  <option value="various">다양한</option>
                </select>
              </div>
            </div>
          </div>
        </section>

        {/* Coupon Codes Section */}
        <section id="coupons" className="border-b border-border py-20 bg-gradient-to-b from-background to-secondary/20">
          <div className="container">
            <div className="mb-12 pb-6 border-b-2 border-primary/20 flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <div className="text-xs uppercase tracking-widest text-primary font-semibold mb-3">
                  쿠폰 아카이브
                </div>
                <h2 className="mb-3 text-4xl font-bold text-foreground">
                  활성 쿠폰 코드
                </h2>
                <p className="text-base text-muted-foreground">
                  최신 게임 쿠폰을 복사하여 게임에서 사용하세요
                </p>
              </div>
              
              {/* User Submission Button */}
              <Button onClick={() => setShowCouponForm(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                새 쿠폰 제보하기
              </Button>
            </div>

            {filteredCoupons.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredCoupons.map((coupon) => {
                  const game = activeGames.find((g) => g.id === coupon.gameId);
                  return (
                    <Card
                      key={coupon.id}
                      className="border border-border bg-card p-6 hover:shadow-lg transition-all duration-200 hover:translate-y-[-4px]"
                    >
                      <div className="mb-4">
                        <h3 className="text-sm font-semibold text-primary mb-1">
                          {game?.name || 'Unknown Game'}
                        </h3>
                        <p className="text-xs text-muted-foreground">{coupon.reward}</p>
                      </div>

                      <div className="mb-4 rounded bg-secondary p-3">
                        <code className="font-mono text-sm font-bold text-foreground">
                          {coupon.code}
                        </code>
                      </div>

                      <div className="mb-4 flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">
                          유효기간: {new Date(coupon.expiryDate).toLocaleDateString('ko-KR')}
                        </span>
                        {new Date(coupon.expiryDate) < new Date() && (
                          <span className="text-destructive font-semibold">만료됨</span>
                        )}
                      </div>

                      <Button
                        onClick={() => handleCopyCoupon(coupon.code)}
                        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                        size="sm"
                      >
                        <Copy className="mr-2 h-4 w-4" />
                        {copiedCode === coupon.code ? '복사됨!' : '복사'}
                      </Button>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-lg border border-border bg-secondary p-12 text-center flex flex-col items-center">
                <AlertCircle className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
                <p className="text-muted-foreground font-medium text-lg">검색 조건에 맞는 쿠폰이 없습니다.</p>
                <p className="text-sm text-muted-foreground mt-2">다른 검색어나 장르를 선택해보세요.</p>
              </div>
            )}
          </div>
        </section>

        {/* Active Games Section */}
        <section id="games" className="border-b border-border py-20">
          <div className="container">
            <div className="mb-12 pb-6 border-b-2 border-primary/20">
              <div className="text-xs uppercase tracking-widest text-primary font-semibold mb-3">
                게임 컬렉션
              </div>
              <h2 className="mb-3 text-4xl font-bold text-foreground">
                활성 게임
              </h2>
              <p className="text-base text-muted-foreground">
                현재 운영 중인 EROLABS 게임들을 탐색하세요
              </p>
            </div>

            {filteredActiveGames.length > 0 ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredActiveGames.map((game) => (
                  <Card
                    key={game.id}
                    className="border border-border bg-card overflow-hidden hover:shadow-lg transition-all duration-200 hover:translate-y-[-4px] flex flex-col"
                  >
                    <div className="flex-1 p-6">
                      <div className="mb-3 inline-block rounded bg-accent/10 px-3 py-1">
                        <span className="text-xs font-semibold text-accent">
                          {game.category === 'male-oriented'
                            ? '남성향'
                            : game.category === 'female-oriented'
                              ? '여성향'
                              : '다양한'}
                        </span>
                      </div>
                      <h3 className="mb-2 text-xl font-bold text-foreground">
                        {game.name}
                      </h3>
                      <p className="mb-4 text-sm text-muted-foreground">
                        {game.description}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {game.platforms.map((platform) => (
                          <span
                            key={platform}
                            className="inline-block rounded bg-secondary px-2 py-1 text-xs text-foreground"
                          >
                            {platform === 'android'
                              ? 'Android'
                              : platform === 'ios'
                                ? 'iOS'
                                : platform === 'windows'
                                  ? 'Windows'
                                  : platform === 'mac'
                                    ? 'Mac'
                                    : 'Browser'}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="border-t border-border p-4">
                      <Button
                        asChild
                        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                        size="sm"
                      >
                        <a href={game.link} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="mr-2 h-4 w-4" />
                          게임 이동
                        </a>
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-border bg-secondary p-12 text-center flex flex-col items-center">
                <AlertCircle className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
                <p className="text-muted-foreground font-medium text-lg">검색 조건에 맞는 게임이 없습니다.</p>
              </div>
            )}
          </div>
        </section>

        {/* Memorial Section - Terminated Games */}
        <section id="memorial" className="py-20 bg-gradient-to-b from-secondary/30 to-secondary/50 border-b border-border">
          <div className="container">
            <div className="mb-12 pb-6 border-b-2 border-destructive/20 flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <Heart className="h-6 w-6 text-destructive" />
                  <div className="text-xs uppercase tracking-widest text-destructive font-semibold">
                    추모 섹션
                  </div>
                </div>
                <h2 className="text-4xl font-bold text-foreground mb-3">
                  추모 아카이브
                </h2>
                <p className="text-base text-muted-foreground">
                  서비스를 종료한 게임들을 기억합니다
                </p>
              </div>

              {/* User Submission Button for Memorial */}
              <Button variant="outline" className="border-destructive/50 text-destructive hover:bg-destructive/10 gap-2" onClick={() => setShowMemorialForm(true)}>
                <Archive className="h-4 w-4" />
                종료 게임 등록하기
              </Button>
            </div>

            {terminatedGames.length > 0 ? (
              <div className="grid gap-6 md:grid-cols-2">
                {terminatedGames.map((game) => {
                  const isAnimating = memorializingId === game.id;
                  const count = memorializedGames[game.id] || 0;
                  
                  return (
                    <Card
                      key={game.id}
                      className="border border-border bg-card p-6 opacity-85 hover:opacity-100 transition-opacity flex flex-col"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                            {game.name}
                            {count > 0 && <span className="text-xs bg-destructive/10 text-destructive px-2 py-0.5 rounded-full flex items-center gap-1"><Heart className="h-3 w-3 fill-destructive" /> {count}</span>}
                          </h3>
                          <p className="text-xs text-destructive font-semibold mt-1">
                            서비스 종료: {game.terminatedDate ? new Date(game.terminatedDate).toLocaleDateString('ko-KR') : '미정'}
                          </p>
                        </div>
                        <Archive className="h-5 w-5 text-muted-foreground opacity-50" />
                      </div>
                      <p className="text-sm text-muted-foreground mb-6 flex-1">
                        {game.description}
                      </p>
                      
                      {/* Memorialize Button with Animation */}
                      <Button 
                        variant="secondary" 
                        className={`w-full relative overflow-hidden transition-all duration-300 ${isAnimating ? 'bg-destructive text-destructive-foreground scale-[0.98]' : 'hover:bg-destructive/10 hover:text-destructive'}`}
                        onClick={() => handleMemorialize(game.id)}
                      >
                        {isAnimating ? (
                          <HeartPulse className="h-5 w-5 animate-ping absolute" />
                        ) : (
                          <Heart className={`mr-2 h-4 w-4 transition-colors ${count > 0 ? 'fill-destructive/50 text-destructive' : ''}`} />
                        )}
                        <span className={isAnimating ? 'opacity-0' : 'opacity-100'}>
                          추모하기
                        </span>
                      </Button>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-lg border border-border bg-card p-8 text-center">
                <p className="text-muted-foreground">종료된 게임이 없습니다.</p>
              </div>
            )}
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-border bg-secondary/50 py-8">
          <div className="container text-center text-sm text-muted-foreground">
            <p>
              EroArchive는 EROLABS의 공식 사이트가 아니며, 팬이 만든 정보 수집 사이트입니다.
            </p>
            <p className="mt-2">
              © 2026 EroArchive. 모든 게임 정보는 EROLABS에서 제공합니다.
            </p>
          </div>
        </footer>
      </main>

      {/* --- MODALS (Custom Implementation to avoid shadcn Dialog dependency issues) --- */}
      
      {/* Coupon Submission Modal */}
      {showCouponForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <Card className="w-full max-w-md bg-background shadow-2xl border-border animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-border">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <Plus className="h-5 w-5 text-primary" />
                새 쿠폰 제보
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                사용 가능한 쿠폰을 공유해주세요. 관리자 승인 후 공개됩니다.
              </p>
            </div>
            <form onSubmit={handleCouponSubmit} className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">대상 게임</label>
                <select 
                  className="w-full p-2 rounded-md border border-border bg-background focus:ring-2 focus:ring-primary outline-none"
                  value={couponForm.gameId}
                  onChange={e => setCouponForm({...couponForm, gameId: e.target.value})}
                >
                  <option value="">게임을 선택하세요</option>
                  {activeGames.map(g => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">쿠폰 코드</label>
                <input 
                  type="text" 
                  placeholder="예: EROLABS2026" 
                  className="w-full p-2 rounded-md border border-border bg-background focus:ring-2 focus:ring-primary outline-none uppercase"
                  value={couponForm.code}
                  onChange={e => setCouponForm({...couponForm, code: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">보상 내용</label>
                <input 
                  type="text" 
                  placeholder="예: 500 젬, 10회 뽑기권" 
                  className="w-full p-2 rounded-md border border-border bg-background focus:ring-2 focus:ring-primary outline-none"
                  value={couponForm.reward}
                  onChange={e => setCouponForm({...couponForm, reward: e.target.value})}
                />
              </div>
              <div className="flex items-start gap-2 pt-2">
                <input 
                  type="checkbox" 
                  id="terms-coupon" 
                  className="mt-1"
                  checked={couponForm.terms}
                  onChange={e => setCouponForm({...couponForm, terms: e.target.checked})}
                />
                <label htmlFor="terms-coupon" className="text-xs text-muted-foreground">
                  (필수) 허위 제보 또는 봇(Bot)을 통한 악성 스팸 제출 시 IP가 차단될 수 있습니다. 이에 동의하십니까?
                </label>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-border">
                <Button type="button" variant="ghost" onClick={() => setShowCouponForm(false)}>취소</Button>
                <Button type="submit" className="gap-2"><Send className="h-4 w-4" /> 제보하기</Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Memorial Submission Modal */}
      {showMemorialForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <Card className="w-full max-w-md bg-background shadow-2xl border-destructive/20 animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-border">
              <h3 className="text-xl font-bold flex items-center gap-2 text-destructive">
                <Archive className="h-5 w-5" />
                종료 게임 등록
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                기억하고 싶은 서비스 종료 게임을 등록하세요. 다수결 동의를 얻으면 추모 공간에 공개됩니다.
              </p>
            </div>
            <form onSubmit={handleMemorialSubmit} className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">게임 이름</label>
                <input 
                  type="text" 
                  placeholder="종료된 게임 이름" 
                  className="w-full p-2 rounded-md border border-border bg-background focus:ring-2 focus:ring-destructive outline-none"
                  value={memorialForm.name}
                  onChange={e => setMemorialForm({...memorialForm, name: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">설명 및 추모 메시지</label>
                <textarea 
                  placeholder="게임에 대한 설명이나 남기고 싶은 메시지를 적어주세요." 
                  className="w-full p-2 rounded-md border border-border bg-background focus:ring-2 focus:ring-destructive outline-none min-h-[100px] resize-none"
                  value={memorialForm.description}
                  onChange={e => setMemorialForm({...memorialForm, description: e.target.value})}
                />
              </div>
              
              <div className="p-3 bg-secondary/50 rounded-lg flex items-start gap-3 mt-2">
                <CheckCircle2 className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                <p className="text-xs text-muted-foreground">
                  등록 신청 후, 다른 사용자들의 <strong className="text-foreground">동의 10회 이상</strong>을 획득하면 메인 추모 아카이브에 정식 등록됩니다.
                </p>
              </div>

              <div className="flex items-start gap-2 pt-2">
                <input 
                  type="checkbox" 
                  id="terms-memorial" 
                  className="mt-1"
                  checked={memorialForm.terms}
                  onChange={e => setMemorialForm({...memorialForm, terms: e.target.checked})}
                />
                <label htmlFor="terms-memorial" className="text-xs text-muted-foreground">
                  (필수) 무분별한 등록 방지를 위해 로봇 검증 시스템을 거칩니다. 악의적 게시물은 삭제될 수 있습니다.
                </label>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-border">
                <Button type="button" variant="ghost" onClick={() => setShowMemorialForm(false)}>취소</Button>
                <Button type="submit" variant="destructive" className="gap-2"><Send className="h-4 w-4" /> 등록 신청</Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
