# MDMelonClicker extension v1 (loaded from GitHub)
_NEW = (
    ("5.7.1", ("Голо-карточки реалистичнее: тонкая перламутровая плёнка, блик и мерцание", "Нажатая карточка поднимается над остальными", "Новое описание плагина")),
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


def _x_setg(self, g, kind, nx, ny, w, ph=None):
    if kind == 0:
        g.setColors(jarray(jint)([C(0x55FFFFFF), C(0x00FFFFFF)]))
        g.setGradientRadius(float(w))
    else:
        sh = int((nx + ny) * 4 if ph is None else ph) % 8
        cs = _RB[sh:] + _RB[:sh] + _RB[sh:sh + 1]
        g.setColors(jarray(jint)([C(c) for c in cs]))
    g.setGradientCenter(float(nx), float(ny))


def _x_all(self, gs, nx, ny, w, ph=None):
    for g, kind in gs:
        _x_setg(self, g, kind, nx, ny, w, ph)


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
    _x_all(self, gs, 0.5, 0.2, self.dp(150))
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
            v.bringToFront()
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
        _x_all(self, gs, 0.5, 0.2, w * 0.9)


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
            _x_all(self, gs, 0.5 + 0.3 * math.sin(t / 9.0), 0.5 + 0.3 * math.cos(t / 12.0), self.dp(150), t / 4.0)
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
        if idx is not None:
            ri = ITEMS[idx][2]
            holo = idx in S["holo"]
            c.setBackground(self.shape(SC, self.dp(16), False, 0xFFFFFFFF if holo else RARS[ri][1]))
            c.setElevation(float(self.dp(3)))
            gs = _x_fg(self, c, 1 if holo else 0, holo or ri == 5, 16)
            c.setOnTouchListener(self._k(Touch(lambda v, e, gs=gs: _x_touch(self, v, e, gs, 13, 1.08, True))))
            c.setCameraDistance(float(self.den * 9000))
            p = g
            for _ in range(4):
                try:
                    p.setClipChildren(False)
                    p = cast(jclass("android.view.ViewGroup"), p.getParent())
                except Exception:
                    break
        else:
            _x_walk(self, c, S)


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
