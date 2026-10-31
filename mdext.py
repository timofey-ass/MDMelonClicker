# MDMelonClicker extension v1 (loaded from GitHub)
_NEW = (
    ("5.7.0", ("Расширения: новое подгружается без переустановки", "7 новых достижений", "Дизайн MD3: средний шрифт, крупные скругления, контуры карточек, пилюлеобразные кнопки, чипы с контуром")),
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
    _O = {k: getattr(MDClickerPlugin, k) for k in ("tv",)}


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
