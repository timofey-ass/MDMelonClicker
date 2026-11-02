# MDMelonClicker extension v1 (loaded from GitHub)
_NEW = (
    ("5.7.4", ("Админ может выдать любому игроку админку на час (кнопка в админ-панели)",)),
    ("5.7.3", ("Свои фразы питомца: кнопка в «Наградах»",)),
    ("5.7.2", ("Питомец-арбузный кот поверх Телеграма: гравитация, перетаскивание, поглаживание, 4 эмоции и фразы. Включается в боковом меню", "Новая валюта «Рыбки»: ежедневные задания и серия входов", "Питомец-тамагочи: голодает со временем, кормить рыбками в «Наградах»")),
    ("5.7.1", ("Голо-карточки реалистичнее: тонкая перламутровая плёнка и мерцание", "Нажатая карточка слегка увеличивается и выходит поверх остальных", "Новое описание плагина")),
    ("5.7.0", ("Расширения: новое подгружается без переустановки", "7 новых достижений", "Дизайн MD3: средний шрифт, скругления, контуры, пилюли-кнопки", "Карточки котов и монета наклоняются за пальцем, свет переливается, у голо и особых блёстки", "Список больше не прыгает в начало при переключении")),
)
_OLD = (
    ("5.5.0", ("Новая редкость «Особый» (+100% за предмет): Джонни и Джайро. Выдаются только админом",)),
    ("5.4.0", ("Самоцветы теперь можно тратить: Алмазный кейс (20), кот на выбор за 10/30/90/250, четыре постоянных улучшения", "Бонус +10% за самоцвет остаётся, даже если их потратить")),
    ("5.3.1", ("Картинки котиков обновляются сами; кнопка «Обновить картинки» в «Ещё»",)),
    ("5.3.0", ("Новые коты: ещё 26, всего 61", "Атлас картинок обновлён: скачается сам при открытии игры")),
    ("5.2.2", ("Новый логотип",)),
    ("5.2.0", ("Новое название MDMelonClicker и новый логотип",)),
    ("5.1.0", ("Все эмодзи заменены нарисованными иконками в цвет темы", "Редкие коты дают больше бонуса: 1 / 3 / 8 / 20 / 50% за предмет")),
    ("5.0.1", ("Подарок от админа теперь выпадает на весь экран, как из кейса",)),
    ("5.0.0", ("Ярлык MDClicker в боковом меню Телеграма", "Настройки (тема, падающий фон, вибрация, звуки) переехали в «Ещё»", "Ник в топе берётся из Телеграма, ID игрока создаётся сам и не меняется", "Одна общая таблица лидеров, без ручной настройки", "Доход без кликера и золотые звёзды теперь всегда включены", "Убрана плавающая кнопка и раздел картинок в настройках", "Админ-панель: выдача котиков, монет и самоцветов игроку по ID", "Новый раздел «Что нового»")),
)
_ids = set(c[0] for c in _NEW + _OLD)
CHANGES = _NEW + tuple(c for c in CHANGES if c[0] not in _ids) + _OLD
_XA = (
    ("x1", "Пятьдесят тысяч", "50 000 тапов", "taps", 50000),
    ("x2", "Триллионер", "Накопить 1 000 000 000 000", "total", 1e12),
    ("x3", "Мегаполис", "100 генераторов", "owned", 100),
    ("x4", "Ловец звёзд", "Поймать 50 звёзд", "stars", 50),
    ("x5", "Жар-птица", "25 лихорадок", "fevers", 25),
    ("x6", "Бессмертный", "5 перерождений", "prest", 5),
    ("x7", "Кейсомания", "Открыть 100 кейсов", "opened", 100),
)
ACH = tuple(a for a in ACH if not a[0].startswith("x")) + _XA

if "_O" not in globals():
    _O = {}
for _k in ("tv", "_tab", "_reopen", "_t_cases", "_t_game", "_coin", "item_view"):
    if _k not in _O:
        _O[_k] = getattr(MDClickerPlugin, _k)


def _x_tv(self, text, size=14, color=None, bold=False, grav=None):
    v = _O["tv"](self, text, size, color, bold, grav)
    if bold and size < 30:
        v.setTypeface(jclass("android.graphics.Typeface").create("sans-serif-medium", 0))
    return v


def _x_card(self, color=None, r=24):
    color = SC if color is None else color
    c = self.lin(False, 16)
    c.setBackground(self.rip(self.shape(color, self.dp(r), False, _mix(color, OUT, 0.2)), self.dp(r)))
    self.pad(c, 16, 14, 16, 14)
    return c


def _x_button(self, text, filled=True):
    t = self.tv(text, 14, ONPRI if filled else PRI, True, 17)
    r = self.dp(50)
    t.setBackground(self.rip(self.shape(PRI, r) if filled else self.shape(0x00000000, r, False, OUT), r))
    self.pad(t, 20, 10, 20, 10)
    return t


def _x_chip(self, text, color=None, fg=None):
    color = SCH if color is None else color
    fg = ONV if fg is None else fg
    t = self.tv(text, 12, fg, True, 17)
    r = self.dp(8)
    t.setBackground(self.rip(self.shape(color, r, False, _mix(SCH, OUT, 0.5) if color == SCH else None), r))
    self.pad(t, 12, 6, 12, 6)
    return t


MDClickerPlugin.tv = _x_tv
MDClickerPlugin.card = _x_card
MDClickerPlugin.button = _x_button
MDClickerPlugin.chip = _x_chip


from java import cast

_RB = (0x3AFF6B9D, 0x3AFFB86B, 0x3AFFF06B, 0x3A8CFF6B, 0x3A6BFFD9, 0x3A6BA8FF, 0x3AA86BFF, 0x3AFF6BD9)


def _x_setg(self, g, kind, nx, ny, w, ph=None, on=True):
    if kind == 0:
        g.setColors(jarray(jint)([C(0x44FFFFFF if on else 0x00FFFFFF), C(0x00FFFFFF)]))
        g.setGradientRadius(float(w))
    else:
        sh = int((nx + ny) * 4 if ph is None else ph) % 8
        cs = _RB[sh:] + _RB[:sh] + _RB[sh:sh + 1]
        g.setColors(jarray(jint)([C(c) for c in cs]))
    g.setGradientCenter(float(nx), float(ny))


def _x_all(self, gs, nx, ny, w, ph=None, on=True):
    for g, kind in gs:
        _x_setg(self, g, kind, nx, ny, w, ph, on)


def _x_glit(self, k):
    if k not in self._gb:
        n = self.dp(80)
        bm = jclass("android.graphics.Bitmap").createBitmap(jint(n), jint(n), jclass("android.graphics.Bitmap$Config").ARGB_8888)
        cv = jclass("android.graphics.Canvas")(bm)
        rnd = random.Random(k + 7)
        for _ in range(6):
            z = rnd.randint(self.dp(4), self.dp(9))
            cv.drawBitmap(self.icon_bmp("sparkle", z, 0xFFFFFFFF), float(rnd.randint(0, n - z)), float(rnd.randint(0, n - z)), None)
        self._gb[k] = bm
    return self._gb[k]


def _x_grad(self, kind, rad):
    g = jclass("android.graphics.drawable.GradientDrawable")()
    g.setGradientType(1 if kind == 0 else 2)
    g.setCornerRadius(float(self.dp(rad)))
    return g


def _x_fg(self, v, kind, glit, rad):
    g = _x_grad(self, kind, rad)
    layers = [g]
    gs = [(g, kind)]
    if kind == 1:
        sp = _x_grad(self, 0, rad)
        layers.append(sp)
        gs.append((sp, 0))
    if glit:
        gls = []
        for k in (0, 1):
            d = jclass("android.graphics.drawable.BitmapDrawable")(self.a.getResources(), _x_glit(self, k))
            d.setTileModeXY(jclass("android.graphics.Shader$TileMode").REPEAT, jclass("android.graphics.Shader$TileMode").REPEAT)
            d.setAlpha(150)
            layers.append(d)
            gls.append(d)
        self._tw.append(gls)
    if kind == 1:
        self._hl.append(gs)
    v.setForeground(jclass("android.graphics.drawable.LayerDrawable")(jarray(jclass("android.graphics.drawable.Drawable"))(layers)))
    _x_all(self, gs, 0.5, 0.2, self.dp(150), None, False)
    return gs


def _x_par(self, v):
    return cast(jclass("android.view.View"), v.getParent())


def _x_touch(self, v, e, gs, deg, sc, lift=False):
    a = int(e.getAction())
    w = max(1, v.getWidth())
    h = max(1, v.getHeight())
    if a in (0, 2):
        nx = min(1.0, max(0.0, e.getX() / w))
        ny = min(1.0, max(0.0, e.getY() / h))
        v.setRotationY(float((nx - 0.5) * 2 * deg))
        v.setRotationX(float(-(ny - 0.5) * 2 * deg))
        if a == 0 and lift:
            v.animate().translationZ(float(self.dp(16))).setDuration(120)
            _x_par(self, v).setTranslationZ(float(self.dp(8)))
        if sc:
            v.setScaleX(float(sc))
            v.setScaleY(float(sc))
        self._ct = time.time()
        _x_all(self, gs, nx, ny, w * 0.9)
    elif a in (1, 3):
        v.animate().rotationX(0.0).rotationY(0.0).scaleX(1.0).scaleY(1.0).translationZ(0.0).setDuration(300).setInterpolator(jclass("android.view.animation.OvershootInterpolator")())
        if lift:
            _x_par(self, v).setTranslationZ(0.0)
        _x_all(self, gs, 0.5, 0.2, w * 0.9, None, False)


def _x_twinkle(self, tok, t=0):
    if tok != self._twt or self._game is None or self.tab != 2:
        return
    if t % 3 == 0:
        for a, b in self._tw:
            x = random.randint(30, 200)
            a.setAlpha(x)
            b.setAlpha(230 - x)
    if time.time() - getattr(self, "_ct", 0) > 1.0:
        for gs in self._hl:
            _x_all(self, gs, 0.5 + 0.3 * math.sin(t / 9.0), 0.5 + 0.3 * math.cos(t / 12.0), self.dp(150), t / 4.0, False)
    run_on_ui_thread(lambda: _x_twinkle(self, tok, t + 1), 150)


def _x_idle(self, tok, t=0):
    if tok != self._idt or self._game is None or self.tab != 0:
        return
    if time.time() - getattr(self, "_ct", 0) > 1.0:
        _x_all(self, self._cg, ((t % 50) / 50.0) * 1.6 - 0.3, 0.3 + 0.2 * ((t % 50) / 50.0), self.dp(200))
    run_on_ui_thread(lambda: _x_idle(self, tok, t + 1), 90)


def _x_item_view(self, idx, size_dp):
    v = _O["item_view"](self, idx, size_dp)
    if size_dp == 46 and getattr(self, "_ivm", None) is not None:
        try:
            self._ivm[int(v.hashCode())] = idx
        except Exception:
            pass
    return v


def _x_walk(self, g, S):
    for i in range(int(g.getChildCount())):
        c = g.getChildAt(i)
        try:
            c = cast(jclass("android.view.ViewGroup"), c)
            n = int(c.getChildCount())
        except Exception:
            continue
        idx = None
        if n >= 2 and c.isClickable():
            try:
                idx = self._ivm.get(int(c.getChildAt(0).hashCode()))
            except Exception:
                idx = None
        if idx is None:
            _x_walk(self, c, S)
            continue
        try:
            ri = ITEMS[idx][2]
            holo = idx in S["holo"]
            c.setBackground(self.shape(SC, self.dp(16), False, 0xFFFFFFFF if holo else RARS[ri][1]))
            c.setElevation(float(self.dp(3)))
            gs = _x_fg(self, c, 1 if holo else 0, holo or ri == 5, 16)
            c.setOnTouchListener(self._k(Touch(lambda v, e, gs=gs: _x_touch(self, v, e, gs, 0, 1.1, True))))
            p = g
            for _ in range(4):
                p.setClipChildren(False)
                p = cast(jclass("android.view.ViewGroup"), p.getParent())
        except Exception:
            pass


def _x_cases(self):
    self._ivm = {}
    self._tw = []
    self._hl = []
    self._gb = getattr(self, "_gb", {})
    sv = _O["_t_cases"](self)
    try:
        _x_walk(self, cast(jclass("android.view.ViewGroup"), sv), self.S())
        self._twt = getattr(self, "_twt", 0) + 1
        if self._tw or self._hl:
            _x_twinkle(self, self._twt)
    except Exception:
        pass
    self._ivm = None
    return sv


def _x_game(self):
    col = _O["_t_game"](self)
    try:
        self._gb = getattr(self, "_gb", {})
        self._tw = []
        self._hl = []
        self._cg = _x_fg(self, self.ui["coin"], 0, False, 120)
        self.ui["coin"].setCameraDistance(float(self.den * 9000))
        self._idt = getattr(self, "_idt", 0) + 1
        _x_idle(self, self._idt)
    except Exception:
        pass
    return col


def _x_coin(self, v, e):
    r = _O["_coin"](self, v, e)
    try:
        _x_touch(self, v, e, self._cg, 14, 0)
    except Exception:
        pass
    return r


def _x_sy(self):
    try:
        return int(self.content.getChildAt(0).getScrollY())
    except Exception:
        return 0


def _x_tab(self, i):
    sy = 0
    r = getattr(self, "_sy", None)
    if r and r[0] == i:
        sy = r[1]
    elif i == getattr(self, "tab", -1) and self._game is not None:
        sy = _x_sy(self)
    self._sy = None
    _O["_tab"](self, i)
    if sy:
        try:
            v = self.content.getChildAt(0)
            for d in (30, 120, 300):
                run_on_ui_thread(lambda v=v: v.scrollTo(0, sy), d)
        except Exception:
            pass


def _x_reopen(self, tab):
    self._sy = (tab, _x_sy(self))
    _O["_reopen"](self, tab)


MDClickerPlugin.item_view = _x_item_view
MDClickerPlugin._t_cases = _x_cases
MDClickerPlugin._t_game = _x_game
MDClickerPlugin._coin = _x_coin
MDClickerPlugin._tab = _x_tab
MDClickerPlugin._reopen = _x_reopen


# ============================== ПИТОМЕЦ ==============================
_PETGEN = 1
PET_URL = "https://raw.githubusercontent.com/timofey-ass/MDMelonClicker/HEAD/mdpet.webp"
PET_FR = {"calm": 0, "happy": 1, "sad": 2, "angry": 3}
PET_PH = {
    "hello": ["Привет!", "Я арбузный кот!", "О, это ты!"],
    "idle": ["Чем помочь?", "Хм…", "Мяу", "Я тут посижу", "Арбуз — это ягода", "Ты молодец!", "Не забудь попить воды", "Пип-пип!", "*оглядывается*", "Интересно, что там в чатах"],
    "lonely": ["Мне скучно…", "Погладь меня?", "Поиграй со мной", "Ты где?.."],
    "tap": ["Ой!", "Эй!", "Чего?", "Я тут!", "Хи!"],
    "annoyed": ["Хватит тыкать!", "Щекотно же!", "Ну всё, обиделся", "Эй, полегче!"],
    "pet": ["Мрр…", "Ещё!", "Приятно", "Хи-хи", "Лучший день!"],
    "drag": ["Ааа!", "Куда мы?", "Поставь меня!"],
    "throw": ["Уиии!", "Я лечу!", "Ваааа!"],
    "dizzy": ["Голова кружится…", "@_@", "Где я?"],
    "wake": ["А? Что?", "Я не спал!", "*зевает*"],
    "jump": ["Хоп!", "Йе!", "Ура!"],
    "hungry": ["Хочу рыбку!", "Я голодный…", "Покорми меня?"],
    "fed": ["Вкуснятина!", "Ням-ням!", "Спасибо за рыбку!"],
}
_AU = jclass("org.telegram.messenger.AndroidUtilities")


def _pc(v, lo, hi):
    return lo if v < lo else hi if v > hi else v


class _Pet:
    G = 2600.0

    def __init__(self, host):
        self.h = host
        self.gen = _PETGEN
        self.on = bool(host.get_setting("pet_show", True))
        self.tok = 0
        self.dead = False
        self.paused = False
        self.decor = self.pet = self.bub = None
        self.parts = []
        self.bm = None
        self.dl = False
        self.mood = 70.0
        self.hun = 100.0
        self.hchk = 0.0
        self.reset()

    def dp(self, v):
        return float(_AU.dp(float(v)))

    def reset(self):
        n = time.monotonic()
        self.state = "idle"
        self.x = self.y = self.vx = self.vy = 0.0
        self.ready = False
        self.last = n
        self.last_act = n
        self.next_act = n + 4.0
        self.next_blink = n + 2.0
        self.blink = 0.0
        self.look = 1
        self.ex, self.eu = None, 0.0
        self.squash = 0.0
        self.hop_on, self.hop_off, self.hop_vy = False, 0.0, 0.0
        self.target = 0.0
        self.touch = None
        self.last_tap = 0.0
        self.taps = []
        self.next_heart = self.next_z = 0.0
        self.bub_on = False
        self.bub_until = 0.0
        self.bub_gen = 0
        self.greet = False
        self.check = 0.0
        self.bounds = None
        self.bt = 0.0
        self.cur = None
        self.dizzy = 0.0
        self.bub_fade = False

    # ---- жизненный цикл ----
    def stop(self):
        self.dead = True
        self.tok += 1
        self.detach()

    def start(self, greet):
        if self.dead or self.paused or not self.on:
            return
        self.greet = self.greet or greet
        self.sched(16)

    def sched(self, ms):
        self.tok += 1
        t = self.tok
        run_on_ui_thread(lambda: self.tick(t), int(ms))

    def toggle(self):
        self.on = not self.on
        self.h.set_setting("pet_show", self.on)
        if self.on:
            self.start(True)
        else:
            self.tok += 1
            self.detach()

    def pause(self, p):
        self.paused = p
        if p:
            self.tok += 1
        else:
            self.start(False)

    # ---- картинки ----
    def frames(self):
        if self.bm is not None:
            return self.bm
        p = str(jclass("org.telegram.messenger.ApplicationLoader").applicationContext.getFilesDir().getAbsolutePath()) + "/mdpet.webp"
        if os.path.isfile(p):
            try:
                at = jclass("android.graphics.BitmapFactory").decodeFile(p)
                fw = int(at.getWidth()) // 4
                fh = int(at.getHeight())
                w = int(self.dp(64))
                h = int(w * fh / fw)
                B = jclass("android.graphics.Bitmap")
                self.bm = [B.createScaledBitmap(B.createBitmap(at, jint(i * fw), jint(0), jint(fw), jint(fh)), jint(w), jint(h), True) for i in range(4)]
                self.w, self.hh = w, h
                return self.bm
            except Exception:
                try:
                    os.remove(p)
                except Exception:
                    pass
        if not self.dl:
            self.dl = True

            def job():
                try:
                    b = urllib.request.urlopen(urllib.request.Request(PET_URL + "?v=" + str(_PETGEN), headers={"User-Agent": "Mozilla/5.0"}), timeout=30).read()
                    open(p, "wb").write(b)
                except Exception:
                    pass
                self.dl = False

            threading.Thread(target=job, daemon=True).start()
        return None

    # ---- вьюхи ----
    def activity(self):
        try:
            return jclass("org.telegram.ui.LaunchActivity").instance
        except Exception:
            return None

    def attach(self):
        act = self.activity()
        if act is None or act.isFinishing() or self.frames() is None:
            return
        decor = act.getWindow().getDecorView()
        if self.pet is not None and self.decor is not None and self.pet.getParent() is not None and self.decor.equals(decor):
            return
        self.detach()
        self.decor = cast(jclass("android.view.ViewGroup"), decor)
        LP = jclass("android.widget.FrameLayout$LayoutParams")
        v = jclass("android.widget.ImageView")(act)
        v.setScaleType(jclass("android.widget.ImageView$ScaleType").FIT_XY)
        v.setClickable(True)
        v.setPivotX(float(self.w / 2.0))
        v.setPivotY(float(self.hh))
        self.tl = Touch(lambda vv, e: self.on_touch(e))
        v.setOnTouchListener(self.tl)
        self.decor.addView(v, LP(jint(self.w), jint(self.hh)))
        self.pet = v
        t = jclass("android.widget.TextView")(act)
        t.setTextSize(13.0)
        t.setMaxWidth(int(self.dp(220)))
        t.setPadding(int(self.dp(10)), int(self.dp(6)), int(self.dp(10)), int(self.dp(6)))
        t.setTypeface(jclass("android.graphics.Typeface").DEFAULT_BOLD)
        t.setVisibility(8)
        self.decor.addView(t, LP(jint(-2), jint(-2)))
        self.bub = t
        self.bub_on = False
        self.cur = None
        self.ready = False

    def rm(self, v):
        if v is None:
            return
        try:
            v.animate().cancel()
            p = v.getParent()
            if p is not None:
                cast(jclass("android.view.ViewGroup"), p).removeView(v)
        except Exception:
            pass

    def detach(self):
        for v in list(self.parts):
            self.rm(v)
        self.parts = []
        self.rm(self.bub)
        self.rm(self.pet)
        self.pet = self.bub = self.decor = None
        self.touch = None
        if self.state in ("press", "drag", "pet"):
            self.state = "idle"

    # ---- цикл ----
    def tick(self, tok):
        if tok != self.tok or self.dead or self.paused or not self.on:
            return
        try:
            self.step()
        except Exception:
            pass
        if tok == self.tok:
            n = time.monotonic()
            fast = self.state in ("press", "drag", "pet", "fly", "walk") or self.hop_on or n < self.squash or self.bub_on
            self.sched(16 if fast else 250 if self.state == "sleep" else 60)

    def get_bounds(self, n):
        if self.bounds is not None and n - self.bt < 0.4:
            return self.bounds
        w, h = int(self.decor.getWidth()), int(self.decor.getHeight())
        top, bot = float(_AU.statusBarHeight), float(_AU.navigationBarHeight)
        try:
            ins = self.decor.getRootWindowInsets()
            if ins is not None:
                top, bot = float(ins.getSystemWindowInsetTop()), float(ins.getSystemWindowInsetBottom())
        except Exception:
            pass
        self.bounds = (0.0, float(max(0, w - self.w)), top, float(max(top, h - bot - self.hh)), w, h)
        self.bt = n
        return self.bounds

    def step(self):
        n = time.monotonic()
        dt = _pc(n - self.last, 0.0, 0.05)
        self.last = n
        self.mood = max(0.0, self.mood - dt / 15.0)
        if n >= self.hchk:
            self.hchk = n + 3.0
            try:
                self.hun = _xhun(self.h)
            except Exception:
                pass
        if n >= self.next_blink:
            self.blink = n + 0.14
            self.next_blink = n + (0.3 if random.random() < 0.2 else random.uniform(2.0, 5.0))
        if n >= self.check:
            self.check = n + 1.0
            self.attach()
        if self.pet is None or self.decor is None or int(self.decor.getWidth()) <= 0:
            return
        x0, x1, y0, y1, W, H = self.get_bounds(n)
        if not self.ready:
            fx = self.h.get_setting("pet_x", None)
            try:
                fx = float(fx) / 1000.0
            except Exception:
                fx = 0.8
            self.x = x0 + (x1 - x0) * _pc(fx, 0.0, 1.0)
            self.y = y1
            self.state = "idle"
            self.ready = True
            if self.greet:
                self.greet = False
                self.say("hello")
        st = self.state
        if st == "press" and self.touch is not None and n - self.touch["t0"] >= 0.4:
            self.state = st = "pet"
            self.next_heart = n + 0.1
            self.hap(0)
        if st == "pet":
            if n >= self.next_heart:
                self.next_heart = n + 0.45
                self.spark("♥")
                self.hap(4)
        elif st == "fly":
            self.fly(dt, n, x0, x1, y0, y1)
        elif st in ("idle", "walk", "sleep"):
            self.ground(dt, n, x0, x1, y1)
        if self.hop_on:
            self.hop_off += self.hop_vy * dt
            self.hop_vy += self.dp(self.G) * dt
            if self.hop_off >= 0.0:
                self.hop_off, self.hop_vy, self.hop_on = 0.0, 0.0, False
                self.squash = n + 0.1
        self.render(n)
        self.upd_bubble(n, W, y0)

    def ground(self, dt, n, x0, x1, y1):
        self.x = _pc(self.x, x0, x1)
        if self.y < y1 - 0.5 and not self.hop_on:
            self.state = "fly"
            self.vx = self.vy = 0.0
            return
        self.y = min(self.y, y1)
        if self.state == "walk":
            d = 1 if self.target > self.x else -1
            self.look = d
            self.x += d * self.dp(42) * dt
            if (d > 0 and self.x >= self.target) or (d < 0 and self.x <= self.target) or self.x <= x0 or self.x >= x1:
                self.x = _pc(self.x, x0, x1)
                self.state = "idle"
                self.next_act = n + random.uniform(2.5, 6.0)
                self.save()
            return
        if self.state == "sleep":
            if n >= self.next_z:
                self.next_z = n + 1.6
                self.spark("z")
            return
        if n - self.last_act > 180 and not self.hop_on:
            self.state = "sleep"
            self.next_z = n + 0.6
            self.hide()
            return
        if n < self.next_act or self.hop_on:
            return
        self.next_act = n + random.uniform(3.5, 9.0)
        r = random.random()
        if r < 0.38:
            t = _pc(self.x + random.uniform(self.dp(40), self.dp(160)) * random.choice((-1, 1)), x0, x1)
            if abs(t - self.x) > self.dp(12):
                self.target = t
                self.state = "walk"
        elif r < 0.58:
            self.look = random.choice((-1, 1))
        elif r < 0.78:
            self.say("hungry" if self.hun < 30 else "lonely" if self.mood < 40 else "idle")
        else:
            self.hop(360)

    def fly(self, dt, n, x0, x1, y0, y1):
        self.x += self.vx * dt
        self.y += self.vy * dt
        self.vy += self.dp(self.G) * dt
        self.vx *= math.exp(-0.35 * dt)
        imp = 0.0
        if self.x < x0:
            self.x = x0
            imp = max(imp, abs(self.vx))
            self.vx = abs(self.vx) * 0.55
        elif self.x > x1:
            self.x = x1
            imp = max(imp, abs(self.vx))
            self.vx = -abs(self.vx) * 0.55
        if self.y < y0:
            self.y = y0
            imp = max(imp, abs(self.vy))
            self.vy = abs(self.vy) * 0.55
        elif self.y > y1:
            self.y = y1
            imp = max(imp, abs(self.vy))
            if self.vy < self.dp(380):
                self.state = "idle"
                self.vx = self.vy = 0.0
                self.squash = n + 0.14
                self.next_act = n + random.uniform(2.0, 5.0)
                self.save()
            else:
                self.vy = -abs(self.vy) * 0.42
                self.vx *= 0.75
                self.squash = n + 0.1
        if imp > self.dp(2300):
            self.expr("sad", 2.6)
            self.dizzy = n + 2.6
            self.say("dizzy")
            self.hap(1)
        elif imp > self.dp(900):
            self.hap(3)

    # ---- вид ----
    def frame_name(self, n):
        st = self.state
        if st in ("drag", "fly"):
            return "sad"
        if st in ("sleep", "pet"):
            return "calm"
        if n < self.eu and self.ex:
            return self.ex
        if n < self.blink:
            return "calm"
        return "angry" if self.hun < 10 else "sad"

    def render(self, n):
        name = self.frame_name(n)
        if name != self.cur:
            self.cur = name
            self.pet.setImageBitmap(self.bm[PET_FR[name]])
        dy = 0.0
        rot = 0.0
        sx = sy = 1.0
        if self.state == "walk":
            dy = -abs(math.sin(n * 10.0)) * self.dp(4)
            rot = math.sin(n * 10.0) * 4.0
        elif self.state == "fly":
            rot = _pc(self.vx / self.dp(70), -25.0, 25.0)
        elif n < getattr(self, "dizzy", 0.0):
            rot = math.sin(n * 10.0) * 7.0
        elif self.state == "pet":
            sy = 0.94 if int(n * 3) % 2 else 1.0
            sx = 1.04 if sy < 1 else 1.0
        elif self.state == "drag" and self.touch is not None:
            rot = _pc(self.touch.get("vx", 0.0) / self.dp(90), -18.0, 18.0)
        if self.state == "press" or n < self.squash or (self.hop_on and self.hop_vy >= 0):
            sy, sx = 0.9, 1.08
        elif self.hop_on:
            sy, sx = 1.08, 0.94
        if self.state == "sleep":
            sy = 0.96 + 0.02 * math.sin(n * 1.6)
        self.pet.setTranslationX(float(self.x))
        self.pet.setTranslationY(float(self.y + self.hop_off + dy))
        self.pet.setRotation(float(rot))
        self.pet.setScaleX(float(sx * (-1 if self.look < 0 else 1)))
        self.pet.setScaleY(float(sy))

    def save(self):
        if self.bounds is None:
            return
        x0, x1 = self.bounds[0], self.bounds[1]
        try:
            self.h.set_setting("pet_x", int(_pc((self.x - x0) / max(1.0, x1 - x0), 0.0, 1.0) * 1000))
        except Exception:
            pass

    def expr(self, name, sec):
        self.ex = name
        self.eu = time.monotonic() + sec

    def hop(self, s):
        if self.state not in ("idle", "walk"):
            return
        self.hop_on = True
        self.hop_vy = -self.dp(s)
        self.hop_off = min(self.hop_off, 0.0)

    def hap(self, k):
        try:
            self.pet.performHapticFeedback(k)
        except Exception:
            pass

    def bump(self, a):
        self.mood = min(100.0, self.mood + a)

    # ---- частицы и облачко ----
    def spark(self, sym):
        if self.decor is None or self.pet is None or len(self.parts) >= 14:
            return
        try:
            col = {"♥": 0xFFFF5C7A, "z": 0xFF8FA3BF, "✦": 0xFFFFC94D}[sym]
            t = jclass("android.widget.TextView")(self.pet.getContext())
            t.setText(sym)
            t.setTextColor(C(col))
            t.setTextSize(float(16 if sym != "z" else 14))
            t.setTypeface(jclass("android.graphics.Typeface").DEFAULT_BOLD)
            self.decor.addView(t, jclass("android.widget.FrameLayout$LayoutParams")(jint(-2), jint(-2)))
            self.parts.append(t)
            hy = self.y + self.hop_off - self.dp(10)
            if sym == "z":
                sx, sy, dr = self.x + self.w * 0.7, hy + self.dp(14), self.dp(18)
            else:
                sx, sy, dr = self.x + self.w / 2.0 + random.uniform(-self.w * 0.25, self.w * 0.25), hy, random.uniform(-self.dp(16), self.dp(16))
            t.setTranslationX(float(sx))
            t.setTranslationY(float(sy))
            t.setScaleX(0.5)
            t.setScaleY(0.5)
            d = 1600 if sym == "z" else 1100
            t.animate().translationXBy(float(dr)).translationYBy(float(-self.dp(random.uniform(40, 58)))).scaleX(1.0).scaleY(1.0).alpha(0.0).setDuration(d)

            def gone(t=t):
                try:
                    self.parts.remove(t)
                except ValueError:
                    pass
                self.rm(t)

            run_on_ui_thread(gone, d + 100)
        except Exception:
            pass

    def say(self, cat, force=False):
        if self.bub is None:
            return
        pool = PET_PH[cat]
        if cat == "idle":
            pool = _xph(self.h) or pool
        self.show(random.choice(pool))

    def show(self, text):
        try:
            Th = jclass("org.telegram.ui.ActionBar.Theme")
            try:
                bgc, fgc, ln = Th.getColor(Th.key_windowBackgroundWhite), Th.getColor(Th.key_windowBackgroundWhiteBlackText), Th.getColor(Th.key_divider)
            except Exception:
                bgc, fgc, ln = jint(-1), jint(-14606047), jint(-2236963)
            g = jclass("android.graphics.drawable.GradientDrawable")()
            g.setCornerRadius(float(self.dp(12)))
            g.setColor(bgc)
            g.setStroke(max(1, int(self.dp(1))), ln)
            b = self.bub
            b.setBackground(g)
            b.setTextColor(fgc)
            b.setElevation(float(self.dp(2)))
            b.animate().cancel()
            b.setText(text)
            b.setAlpha(0.0)
            b.setVisibility(0)
            self.bub_gen += 1
            self.bub_on = True
            self.bub_fade = True
            self.bub_until = time.monotonic() + 2.0 + len(text) * 0.05
        except Exception:
            pass

    def hide(self):
        if self.bub is None or not self.bub_on:
            return
        self.bub_on = False
        self.bub_gen += 1
        gen, b = self.bub_gen, self.bub
        b.animate().alpha(0.0).setDuration(180)
        run_on_ui_thread(lambda: b.setVisibility(8) if gen == self.bub_gen else None, 220)

    def upd_bubble(self, n, W, y0):
        if self.bub is None or not self.bub_on:
            return
        if n >= self.bub_until:
            self.hide()
            return
        bw, bh = int(self.bub.getWidth()), int(self.bub.getHeight())
        if bw <= 0:
            return
        m = self.dp(4)
        bx = _pc(self.x + self.w / 2.0 - bw / 2.0, m, max(m, W - bw - m))
        by = self.y + self.hop_off - bh - m
        if by < y0:
            by = self.y + self.hh + m
        self.bub.setTranslationX(float(bx))
        self.bub.setTranslationY(float(by))
        if getattr(self, "bub_fade", False):
            self.bub_fade = False
            self.bub.animate().alpha(1.0).setDuration(150)

    # ---- ввод ----
    def on_touch(self, e):
        a = int(e.getActionMasked())
        rx, ry = float(e.getRawX()), float(e.getRawY())
        n = time.monotonic()
        if a == 0:
            was = self.state == "sleep"
            self.last_act = n
            self.touch = {"x0": rx, "y0": ry, "t0": n, "ox": rx - self.x, "oy": ry - self.y, "hist": [(n, rx, ry)], "anchor": rx, "dir": 0, "vx": 0.0}
            self.hop_on, self.hop_off, self.hop_vy = False, 0.0, 0.0
            self.vx = self.vy = 0.0
            self.state = "press"
            if was:
                self.expr("sad", 0.9)
                self.say("wake")
            self.sched(0)
            return True
        t = self.touch
        if t is None:
            return False
        if a == 2:
            hist = t["hist"]
            hist.append((n, rx, ry))
            while len(hist) > 2 and n - hist[0][0] > 0.1:
                hist.pop(0)
            if self.state == "press" and math.hypot(rx - t["x0"], ry - t["y0"]) > self.dp(8):
                self.state = "drag"
                self.hap(3)
                if random.random() < 0.25:
                    self.say("drag")
            if self.state == "drag":
                W, H = int(self.decor.getWidth()), int(self.decor.getHeight())
                self.x = _pc(rx - t["ox"], -self.w * 0.3, W - self.w * 0.7)
                self.y = _pc(ry - t["oy"], 0.0, H - self.hh * 0.5)
                t0, xx = hist[0][0], hist[0][1]
                if n - t0 > 0.005:
                    t["vx"] = (rx - xx) / (n - t0)
            elif self.state == "pet":
                dx = rx - t["anchor"]
                if abs(dx) > self.dp(10):
                    d = 1 if dx > 0 else -1
                    if t["dir"] and d != t["dir"]:
                        self.spark("♥")
                        self.hap(4)
                    t["dir"] = d
                    t["anchor"] = rx
            return True
        if a in (1, 3):
            self.touch = None
            self.last_act = n
            st = self.state
            if st == "drag":
                self.release(n, t, a == 3)
            elif st == "pet":
                self.state = "idle"
                self.expr("happy", 2.2)
                self.bump(25)
                self.next_act = n + random.uniform(3.0, 6.0)
                if random.random() < 0.6:
                    self.say("pet")
            elif st == "press":
                self.state = "idle"
                if a == 1:
                    self.tap(n)
            self.sched(0)
            return True
        return True

    def release(self, n, t, cancelled):
        vx = vy = 0.0
        h = t["hist"]
        if not cancelled and len(h) >= 2:
            t0, x0, y0 = h[0]
            t1, x1, y1 = h[-1]
            if t1 - t0 > 0.005 and n - t1 < 0.08:
                vx, vy = (x1 - x0) / (t1 - t0), (y1 - y0) / (t1 - t0)
        lim = self.dp(6000)
        vx, vy = _pc(vx, -lim, lim), _pc(vy, -lim, lim)
        self.state = "fly"
        self.vx, self.vy = vx, vy
        if math.hypot(vx, vy) > self.dp(2600):
            self.say("throw")

    def tap(self, n):
        if n - self.last_tap < 0.32:
            self.last_tap = 0.0
            self.hop(720)
            self.expr("happy", 1.3)
            self.bump(15)
            for _ in range(3):
                self.spark("✦")
            self.hap(0)
            if random.random() < 0.4:
                self.say("jump")
            return
        self.last_tap = n
        self.taps = [x for x in self.taps if n - x < 2.5] + [n]
        if len(self.taps) >= 6:
            self.taps = []
            self.expr("angry", 2.5)
            self.bump(-10)
            self.say("annoyed")
            self.hap(1)
            return
        self.squash = n + 0.12
        self.expr("happy", 0.6)
        self.bump(6)
        self.hop(330)
        self.hap(3)
        if random.random() < 0.3:
            self.say("tap")


def _pet_boot(host):
    g = globals()
    p = g.get("_PET")
    if p is not None and p.h is host and not p.dead and p.gen == _PETGEN:
        return
    if p is not None:
        p.stop()
    p = _Pet(host)
    g["_PET"] = p
    if not getattr(host, "_pm", False):
        host._pm = True
        try:
            from base_plugin import MenuItemData, MenuItemType
            host.add_menu_item(MenuItemData(menu_type=MenuItemType.DRAWER_MENU, text="Питомец", icon="msg_emoji_cat", on_click=lambda ctx=None: run_on_ui_thread(lambda: globals()["_PET"].toggle())))
        except Exception:
            pass
    p.start(True)


def _x_chk(self, quiet=False):
    r = _O["_check_update"](self, quiet)
    try:
        _pet_boot(self)
    except Exception:
        pass
    return r


def _x_unload(self):
    try:
        globals()["_PET"].stop()
    except Exception:
        pass
    return _O["on_plugin_unload"](self)


def _x_appev(self, ev):
    try:
        from base_plugin import AppEvent
        p = globals().get("_PET")
        if p is not None:
            if ev == AppEvent.PAUSE:
                p.pause(True)
            elif ev == AppEvent.RESUME:
                p.pause(False)
    except Exception:
        pass


for _k in ("_check_update", "on_plugin_unload"):
    if _k not in _O:
        _O[_k] = getattr(MDClickerPlugin, _k)
MDClickerPlugin._check_update = _x_chk
MDClickerPlugin.on_plugin_unload = _x_unload
MDClickerPlugin.on_app_event = _x_appev


# ============== РЫБКИ, ЗАДАНИЯ, КОРМЛЕНИЕ ==============
_QT = {"taps": "Сделай тапов: %s", "opened": "Открой кейсов: %s", "stars": "Поймай золотых звёзд: %s", "fevers": "Включи лихорадку раз: %s", "total": "Накопи монет: %s"}


def _xd(h):
    try:
        d = json.loads(str(h.get_setting("x_d", "{}")))
    except Exception:
        d = {}
    for k, v in (("fish", 0), ("streak", 0), ("sd", ""), ("qd", ""), ("q", []), ("hun", 80.0), ("hts", 0.0), ("feeds", 0)):
        d.setdefault(k, v)
    if not d["hts"]:
        d["hts"] = time.time()
        _xs(h, d)
    return d


def _xs(h, d):
    h.set_setting("x_d", json.dumps(d))


def _xhun(h, d=None):
    d = d or _xd(h)
    return max(0.0, d["hun"] - (time.time() - d["hts"]) / 360.0)


def _xquests(h, d):
    today = time.strftime("%Y-%m-%d")
    if d["qd"] == today and d["q"]:
        return
    rnd = random.Random(today + str(h.get_setting("lb_uid", "")))
    kinds = rnd.sample(list(_QT), 3)
    q = []
    for k in kinds:
        goal = {"taps": rnd.choice((200, 400, 800)), "opened": rnd.choice((3, 5, 8)), "stars": rnd.choice((2, 3, 5)), "fevers": rnd.choice((1, 2)), "total": max(5000, int(h.cps() * 600))}[k]
        q.append([k, goal, h.stat(k), 0])
    d["qd"], d["q"] = today, q
    _xs(h, d)


def _x_pethap(h, kind):
    p = globals().get("_PET")
    if p is None or p.pet is None:
        return
    p.expr("happy", 2.0)
    p.bump(20)
    p.say(kind)
    for _ in range(3):
        p.spark("♥")


def _x_build(self, box):
    d = _xd(self)
    _xquests(self, d)
    today = time.strftime("%Y-%m-%d")
    yest = time.strftime("%Y-%m-%d", time.localtime(time.time() - 86400))
    done_today = d["sd"] == today
    ns = d["streak"] + 1 if d["sd"] == yest else 1
    c = self.card(PRC)
    info = self.lin(True)
    info.addView(self.icn(self.tv("Рыбки: %d" % d["fish"], 16, ONPRC, True), "fish", ONPRC, 18))
    info.addView(self.tv("Серия входа: %d дн." % d["streak"], 12, ONPRC))
    c.addView(info, self.lp(0, -2, 0, 0, 0, 0, 1))
    b = self.button("Сегодня получено" if done_today else "Вход +%d" % min(ns, 7), True)
    b.setAlpha(0.5 if done_today else 1.0)

    def day(v):
        dd = _xd(self)
        if dd["sd"] == today:
            return
        dd["streak"] = ns
        dd["sd"] = today
        dd["fish"] += min(ns, 7)
        _xs(self, dd)
        toast("Серия %d дн.: +%d рыбок" % (ns, min(ns, 7)))
        self._tab(3)

    b.setOnClickListener(self._k(Click(day)))
    c.addView(b)
    box.addView(c, self.lp(-1, -2, 0, 0, 0, 8))
    box.addView(self.tv("Задания дня", 13, PRI, True), self.lp(-1, -2, 4, 4, 0, 6))
    for i, (k, goal, base, got) in enumerate(d["q"]):
        prog = max(0, self.stat(k) - base)
        r = self.card(SC)
        r.setOrientation(1)
        head = self.lin(False, 16)
        head.addView(self.tv(_QT[k] % fmt(goal), 14, ON, True), self.lp(0, -2, 0, 0, 0, 0, 1))
        ok = prog >= goal
        if got:
            chip = self.chip("Получено", SCH, ONV)
        elif ok:
            chip = self.icn(self.chip("+3", PRC, ONPRC), "fish", ONPRC, 14)

            def claim(v, i=i):
                dd = _xd(self)
                if dd["q"][i][3]:
                    return
                dd["q"][i][3] = 1
                dd["fish"] += 3
                if all(x[3] for x in dd["q"]):
                    dd["fish"] += 4
                    toast("Все задания выполнены: +4 рыбки")
                _xs(self, dd)
                self._tab(3)

            chip.setOnClickListener(self._k(Click(claim)))
        else:
            chip = self.chip("%s/%s" % (fmt(prog), fmt(goal)), SCH, ONV)
        head.addView(chip)
        r.addView(head)
        r.addView(self._bar(1.0 if got else min(1.0, prog / float(goal))), self.lp(-1, -2, 0, 6, 0, 0))
        box.addView(r, self.lp(-1, -2, 0, 0, 0, 6))
    h = _xhun(self, d)
    p = self.card(SC)
    p.setOrientation(1)
    head = self.lin(False, 16)
    head.addView(self.tv("Питомец", 15, PRI, True), self.lp(0, -2, 0, 0, 0, 0, 1))
    head.addView(self.chip("Сытость %d%%" % int(h), SCH, ONV))
    p.addView(head)
    p.addView(self._bar(h / 100.0), self.lp(-1, -2, 0, 6, 0, 0))
    fb = self.icn(self.button("Покормить · 5", True), "fish", ONPRI, 16)
    fb.setAlpha(1.0 if d["fish"] >= 5 else 0.45)

    def feed(v):
        dd = _xd(self)
        if dd["fish"] < 5:
            toast("Не хватает рыбок")
            return
        dd["hun"] = min(100.0, _xhun(self, dd) + 35.0)
        dd["hts"] = time.time()
        dd["fish"] -= 5
        dd["feeds"] += 1
        _xs(self, dd)
        _x_pethap(self, "fed")
        self._tab(3)

    fb.setOnClickListener(self._k(Click(feed)))
    rb = self.lin(False)
    rb.addView(fb)
    pb = self.button("Свои фразы", False)
    pb.setOnClickListener(self._k(Click(lambda v: _x_phrases(self))))
    rb.addView(pb, self.lp(-2, -2, 8, 0, 0, 0))
    p.addView(rb, self.lp(-1, -2, 0, 8, 0, 0))
    p.addView(self.tv("Рыбки даются за задания, серию входов и достижения. Без еды питомец грустит, а потом злится. «Свои фразы» — то, что он говорит сам по себе.", 11, OUT), self.lp(-1, -2, 0, 6, 0, 0))
    box.addView(p, self.lp(-1, -2, 0, 4, 0, 12))


def _x_ach(self):
    sv = _O["_t_ach"](self)
    try:
        col = cast(jclass("android.view.ViewGroup"), cast(jclass("android.view.ViewGroup"), sv).getChildAt(0))
        box = self.lin(True)
        _x_build(self, box)
        col.addView(box, 0, self.lp(-1, -2))
    except Exception:
        pass
    return sv


def _x_chkach(self):
    n0 = len(self.S()["ach"])
    _O["check_ach"](self)
    k = len(self.S()["ach"]) - n0
    if k > 0:
        d = _xd(self)
        d["fish"] += k
        _xs(self, d)


for _k in ("_t_ach", "check_ach"):
    if _k not in _O:
        _O[_k] = getattr(MDClickerPlugin, _k)
MDClickerPlugin._t_ach = _x_ach
MDClickerPlugin.check_ach = _x_chkach


# ============== СВОИ ФРАЗЫ ПИТОМЦА ==============
def _xph(h):
    try:
        v = json.loads(str(h.get_setting("pet_ph", "[]")))
        return [str(x) for x in v if str(x).strip()]
    except Exception:
        return []


class _DClick(dynamic_proxy(jclass("android.content.DialogInterface$OnClickListener"))):
    def __init__(self, fn):
        super().__init__()
        self._fn = fn

    def onClick(self, d, w):
        try:
            self._fn()
        except Exception:
            pass


def _x_phrases(self):
    try:
        et = jclass("android.widget.EditText")(self.a)
        et.setInputType(1 | 0x20000)
        et.setMinLines(5)
        et.setGravity(51)
        et.setHint("Одна фраза на строку")
        et.setText("\n".join(_xph(self)))
        fr = jclass("android.widget.FrameLayout")(self.a)
        fr.setPadding(int(self.dp(20)), int(self.dp(8)), int(self.dp(20)), 0)
        fr.addView(et)

        def save():
            lines = [x.strip()[:120] for x in str(et.getText().toString()).split("\n") if x.strip()][:30]
            self.set_setting("pet_ph", json.dumps(lines))
            toast("Фраз сохранено: %d" % len(lines))
            p = globals().get("_PET")
            if lines and p is not None and p.bub is not None:
                p.show(random.choice(lines))

        def reset():
            self.set_setting("pet_ph", "[]")
            toast("Фразы сброшены")

        b = jclass("android.app.AlertDialog$Builder")(self.a)
        b.setTitle("Фразы питомца")
        b.setMessage("Он будет говорить их сам по себе. Пусто — стандартные фразы.")
        b.setView(fr)
        b.setPositiveButton("Сохранить", self._k(_DClick(save)))
        b.setNeutralButton("Сбросить", self._k(_DClick(reset)))
        b.setNegativeButton("Отмена", None)
        b.show()
    except Exception as e:
        toast("Не открылось: " + type(e).__name__)


# ============== АДМИНКА НА ЧАС ==============
for _k in ("_is_admin", "_apply", "_admin_card"):
    if _k not in _O:
        _O[_k] = getattr(MDClickerPlugin, _k)


def _x_isadm(self):
    if _O["_is_admin"](self):
        return True
    try:
        return time.time() < float(self.get_setting("adm_until", 0) or 0)
    except Exception:
        return False


def _x_apply(self, kind, arg, cnt):
    if kind == "adm":
        m = float(arg)
        self.set_setting("adm_until", time.time() + m * 60 if m > 0 else 0)
        toast("Админка на %d мин" % m if m > 0 else "Админка снята")
        return
    return _O["_apply"](self, kind, arg, cnt)


def _x_admcard(self, col):
    _O["_admin_card"](self, col)
    try:
        if self._uid() != self.ADM:
            return
        card = cast(jclass("android.view.ViewGroup"), col.getChildAt(int(col.getChildCount()) - 1))
        et = cast(jclass("android.widget.TextView"), card.getChildAt(2))

        def send(m):
            def f(v):
                t = str(et.getText().toString()).strip()
                if not t or t == self._uid():
                    toast("Впиши ID другого игрока")
                    return
                self._give(t, "adm", m, 1)
            return f

        card.addView(self.tv("Временная админка", 13, ONPRC, True), self.lp(-1, -2, 0, 12, 0, 0))
        r = self.lin(False, 17)
        b1 = self.button("Админ на 1 час", True)
        b1.setOnClickListener(self._k(Click(send(60))))
        b2 = self.button("Забрать", False)
        b2.setOnClickListener(self._k(Click(send(0))))
        r.addView(b1, self.lp(0, -2, 2, 4, 2, 0, 2))
        r.addView(b2, self.lp(0, -2, 2, 4, 2, 0, 1))
        card.addView(r, self.lp(-1, -2))
    except Exception:
        pass


MDClickerPlugin._is_admin = _x_isadm
MDClickerPlugin._apply = _x_apply
MDClickerPlugin._admin_card = _x_admcard
