export type Language = 'ko' | 'en' | 'ja';

export interface Translation {
  // Navigation
  nav: {
    story: string;
    characters: string;
    rewards: string;
    empire: string;
    preregister: string;
  };
  
  // Hero Section
  hero: {
    title: string;
    subtitle: string;
    cta: string;
    counter: string;
    people: string;
  };
  
  // Story Section
  story: {
    title: string;
    subtitle: string;
    description: string[];
    features: {
      title: string;
      description: string;
    }[];
  };
  
  // Characters Section
  characters: {
    title: string;
    subtitle: string;
    list: {
      name: string;
      title: string;
      description: string;
    }[];
    stats: {
      strength: string;
      agility: string;
      magic: string;
    };
  };
  
  // Rewards Section
  rewards: {
    title: string;
    subtitle: string;
    description: string[];
    list: {
      title: string;
      description: string;
      tier: string;
    }[];
    earlyBird: {
      title: string;
      description: string;
      reward: string;
      current: string;
      target: string;
      remaining: string;
    };
  };
  
  // Empire Section
  empire: {
    title: string;
    subtitle: string;
    description: string[];
    status: {
      title: string;
      you: string;
      referrals: string;
      population: string;
      level: string;
      recentReferrals: string;
    };
    rewardsTiers: {
      title: string;
      tiers: {
        name: string;
        requirement: string;
        reward: string;
      }[];
    };
    invite: string;
  };
  
  // Reservation Form
  reservation: {
    title: string;
    steps: {
      title: string;
      description: string;
      reward: string;
    }[];
    stories: {
      title: string;
      content: string;
    }[];
    form: {
      nickname: string;
      nicknamePlaceholder: string;
      email: string;
      emailPlaceholder: string;
      phone: string;
      phonePlaceholder: string;
      playstyle: string;
      warrior: string;
      assassin: string;
      mage: string;
      referralTitle: string;
      referralDescription: string[];
      copyCode: string;
      next: string;
      complete: string;
    };
    messages: {
      fillRequired: string;
      copySuccess: string;
      copyError: string;
      complete: string;
    };
  };
  
  // Footer
  footer: {
    tagline: string[];
    quickLinks: string;
    links: {
      story: string;
      characters: string;
      rewards: string;
      community: string;
    };
    social: string;
    copyright: string;
    terms: string;
    privacy: string;
    cookies: string;
  };
}

export const translations: Record<Language, Translation> = {
  ko: {
    nav: {
      story: "게임 소개",
      characters: "캐릭터",
      rewards: "보상",
      empire: "제국",
      preregister: "사전예약",
    },
    hero: {
      title: "REALM OF SHADOWS",
      subtitle: "동료를 모으고, 길드를 성장시키고, 제국을 지배하라.\n\n실시간 네트원크 성장 RPG 지금 사전등록하고 창립 보상 받기 .",
      cta: "지금 사전예약하기",
      counter: "현재",
      people: "명 예약 완료",
    },
    story: {
      title: "어둠에 삼켜진 왕국",
      subtitle: "",
      description: [
        "천 년의 평화가 깨지고, 고대의 저주가 땅을 뒤덮었다.",
        "왕국은 파멸했고, 생존자들은 그림자 속으로 흩어졌다.",
        "이제 당신이 영웅이 되어, 잃어버린 빛을 되찾을 차례다.",
      ],
      features: [
        {
          title: "몰입형 세계관",
          description: "엘든링에서 영감을 받은 광대하고 어두운 판타지 세계를 탐험하세요.",
        },
        {
          title: "전략적 전투",
          description: "타이밍과 전략이 생존을 결정하는 하드코어 전투 시스템을 경험하세요.",
        },
        {
          title: "깊이 있는 스토리",
          description: "선택에 따라 달라지는 복수의 엔딩과 숨겨진 비밀을 발견하세요.",
        },
      ],
    },
    characters: {
      title: "캐릭터 선택",
      subtitle: "당신의 플레이 스타일에 맞는 영웅을 선택하세요",
      list: [
        {
          name: "어둠의 기사",
          title: "Dark Knight",
          description: "한때 왕국의 수호자였으나, 이제는 복수의 칼날을 휘두르는 타락한 전사. 압도적인 근접 전투력을 자랑합니다.",
        },
        {
          name: "그림자 암살자",
          title: "Shadow Assassin",
          description: "어둠 속에서 움직이는 존재. 적을 그림자에서 기습하고 흔적 없이 사라지는 치명적인 암살자입니다.",
        },
        {
          name: "불꽃의 마법사",
          title: "Pyromancer",
          description: "금지된 불꽃 마법을 다루는 마도사. 멀리서 적을 불태우고 대규모 파괴를 일으키는 강력한 마법사입니다.",
        },
      ],
      stats: {
        strength: "strength",
        agility: "agility",
        magic: "magic",
      },
    },
    rewards: {
      title: "사전예약 독점 보상",
      subtitle: "",
      description: [
        "지금 예약하고 다른 플레이어들보다 앞서가세요.",
        "출시 첫날부터 전설적인 영웅으로 시작하세요.",
      ],
      list: [
        {
          title: "독점 캐릭터 스킨",
          description: "사전예약자만 획득할 수 있는 한정판 '그림자 군주' 스킨",
          tier: "전설",
        },
        {
          title: "프리미엄 화폐 5000개",
          description: "게임 내 모든 아이템을 구매할 수 있는 프리미엄 화폐",
          tier: "영웅",
        },
        {
          title: "'선구자' 칭호",
          description: "게임 세계의 첫 번째 영웅임을 증명하는 특별 칭호",
          tier: "전설",
        },
        {
          title: "7일 프리미엄 패스",
          description: "출시 후 7일간 모든 프리미엄 혜택 무료 제공",
          tier: "영웅",
        },
      ],
      earlyBird: {
        title: "얼리버드 특별 보너스",
        description: "예약자 50만 명 돌파 시 모든 예약자에게",
        reward: "'황금 용의 탈것'",
        current: "현재 예약자",
        target: "목표까지",
        remaining: "명 남음",
      },
    },
    empire: {
      title: "나의 제국",
      subtitle: "",
      description: [
        "친구를 초대하고 당신만의 제국을 건설하세요.",
        "더 많은 추천인을 모을수록 더 강력한 보상을 획득합니다.",
      ],
      status: {
        title: "제국 현황",
        you: "당신 (제국의 군주)",
        referrals: "직접 추천인",
        population: "총 제국 인구",
        level: "제국 레벨",
        recentReferrals: "최근 추천인",
      },
      rewardsTiers: {
        title: "보상 단계",
        tiers: [
          {
            name: "1단계",
            requirement: "친구 5명 초대",
            reward: "전설 무기 스킨",
          },
          {
            name: "2단계",
            requirement: "친구 10명 초대",
            reward: "독점 캐릭터 의상",
          },
          {
            name: "3단계",
            requirement: "친구 20명 초대",
            reward: "황금 왕관 + 칭호",
          },
          {
            name: "4단계",
            requirement: "친구 50명 초대",
            reward: "신화급 탈것",
          },
          {
            name: "전설",
            requirement: "친구 100명 초대",
            reward: "제국 파운더 칭호",
          },
        ],
      },
      invite: "친구 초대하기",
    },
    reservation: {
      title: "사전예약",
      steps: [
        {
          title: "기본 정보",
          description: "당신의 정보를 입력하세요",
          reward: "독점 배경화면 잠금해제",
        },
        {
          title: "게임 설정",
          description: "플레이 스타일을 선택하세요",
          reward: "전설급 무기 스킨 획득",
        },
        {
          title: "친구 초대",
          description: "함께할 동료를 초대하세요",
          reward: "제국 확장 시작",
        },
      ],
      stories: [
        {
          title: "고대 왕국의 몰락",
          content: "천 년 전, 이 땅을 지배했던 위대한 왕국이 있었다. 그들은 빛의 수정을 통해 무한한 힘을 얻었으나, 욕심이 파멸을 불렀다...",
        },
        {
          title: "잊혀진 영웅들",
          content: "어둠이 찾아왔을 때, 다섯 명의 영웅이 일어섰다. 그러나 그들조차 그림자의 힘을 막지 못했고, 하나씩 사라져갔다...",
        },
        {
          title: "예언의 시작",
          content: "고대 예언서에는 이렇게 적혀있다. '어둠이 가장 짙을 때, 별을 따르는 자가 나타나 빛을 되찾으리라'...",
        },
      ],
      form: {
        nickname: "닉네임",
        nicknamePlaceholder: "게임 내 사용할 닉네임",
        email: "이메일",
        emailPlaceholder: "your@email.com",
        phone: "휴대폰 번호 (선택)",
        phonePlaceholder: "010-0000-0000",
        playstyle: "선호하는 플레이 스타일",
        warrior: "전사",
        assassin: "암살자",
        mage: "마법사",
        referralTitle: "당신의 추천 코드",
        referralDescription: [
          "친구를 초대하고 함께 보상을 받으세요!",
          "친구 1명당 독점 스킨 1개 지급",
        ],
        copyCode: "코드 복사하기",
        next: "다음 단계",
        complete: "예약 완료하기",
      },
      messages: {
        fillRequired: "닉네임과 이메일을 입력해주세요",
        copySuccess: "추천 코드가 복사되었습니다!",
        copyError: "코드 복사에 실패했습니다. 수동으로 복사해주세요.",
        complete: "사전예약이 완료되었습니다! 독점 보상이 계정에 지급되었습니다.",
      },
    },
    footer: {
      tagline: ["어둠이 지배하는 세계에서", "당신의 전설을 써내려가세요."],
      quickLinks: "빠른 링크",
      links: {
        story: "게임 소개",
        characters: "캐릭터",
        rewards: "사전등록 혜택",
        community: "커뮤니티",
      },
      social: "소셜 미디어",
      copyright: "© 2025 Realm of Shadows. All rights reserved.",
      terms: "이용약관",
      privacy: "개인정보처리방침",
      cookies: "쿠키 정책",
    },
  },
  en: {
    nav: {
      story: "Story",
      characters: "Characters",
      rewards: "Rewards",
      empire: "Empire",
      preregister: "Pre-register",
    },
    hero: {
      title: "REALM OF SHADOWS",
      subtitle: "Forge your destiny in a world ruled by darkness.\nA legendary dark fantasy RPG is coming soon.",
      cta: "Pre-register Now",
      counter: "Currently",
      people: "pre-registered",
    },
    story: {
      title: "The Kingdom Consumed by Darkness",
      subtitle: "",
      description: [
        "A thousand years of peace shattered, and an ancient curse engulfed the land.",
        "The kingdom fell, and survivors scattered into the shadows.",
        "Now it's your turn to become a hero and reclaim the lost light.",
      ],
      features: [
        {
          title: "Immersive World",
          description: "Explore a vast dark fantasy world inspired by Elden Ring.",
        },
        {
          title: "Strategic Combat",
          description: "Experience hardcore combat where timing and strategy determine survival.",
        },
        {
          title: "Deep Narrative",
          description: "Discover multiple endings and hidden secrets based on your choices.",
        },
      ],
    },
    characters: {
      title: "Choose Your Character",
      subtitle: "Select a hero that matches your playstyle",
      list: [
        {
          name: "Dark Knight",
          title: "Dark Knight",
          description: "Once a guardian of the kingdom, now a fallen warrior wielding the blade of vengeance. Boasts overwhelming melee combat prowess.",
        },
        {
          name: "Shadow Assassin",
          title: "Shadow Assassin",
          description: "A being that moves through darkness. A lethal assassin who ambushes enemies from shadows and vanishes without a trace.",
        },
        {
          name: "Pyromancer",
          title: "Pyromancer",
          description: "A sorcerer who wields forbidden flame magic. A powerful mage who incinerates enemies from afar and causes mass destruction.",
        },
      ],
      stats: {
        strength: "strength",
        agility: "agility",
        magic: "magic",
      },
    },
    rewards: {
      title: "Exclusive Pre-registration Rewards",
      subtitle: "",
      description: [
        "Pre-register now and get ahead of other players.",
        "Start as a legendary hero from day one.",
      ],
      list: [
        {
          title: "Exclusive Character Skin",
          description: "Limited edition 'Shadow Lord' skin available only to pre-registrants",
          tier: "Legendary",
        },
        {
          title: "5000 Premium Currency",
          description: "Premium currency to purchase any item in the game",
          tier: "Epic",
        },
        {
          title: "'Pioneer' Title",
          description: "Special title proving you're one of the first heroes in the game world",
          tier: "Legendary",
        },
        {
          title: "7-Day Premium Pass",
          description: "Free access to all premium benefits for 7 days after launch",
          tier: "Epic",
        },
      ],
      earlyBird: {
        title: "Early Bird Special Bonus",
        description: "When 500K pre-registrations reached, all users will receive",
        reward: "'Golden Dragon Mount'",
        current: "Current registrations",
        target: "Remaining",
        remaining: "to goal",
      },
    },
    empire: {
      title: "My Empire",
      subtitle: "",
      description: [
        "Invite friends and build your own empire.",
        "The more referrals you gather, the more powerful rewards you earn.",
      ],
      status: {
        title: "Empire Status",
        you: "You (Lord of the Empire)",
        referrals: "Direct Referrals",
        population: "Total Population",
        level: "Empire Level",
        recentReferrals: "Recent Referrals",
      },
      rewardsTiers: {
        title: "Reward Tiers",
        tiers: [
          {
            name: "Tier 1",
            requirement: "Invite 5 friends",
            reward: "Legendary Weapon Skin",
          },
          {
            name: "Tier 2",
            requirement: "Invite 10 friends",
            reward: "Exclusive Character Outfit",
          },
          {
            name: "Tier 3",
            requirement: "Invite 20 friends",
            reward: "Golden Crown + Title",
          },
          {
            name: "Tier 4",
            requirement: "Invite 50 friends",
            reward: "Mythic Mount",
          },
          {
            name: "Legend",
            requirement: "Invite 100 friends",
            reward: "Empire Founder Title",
          },
        ],
      },
      invite: "Invite Friends",
    },
    reservation: {
      title: "Pre-registration",
      steps: [
        {
          title: "Basic Info",
          description: "Enter your information",
          reward: "Unlock exclusive wallpaper",
        },
        {
          title: "Game Settings",
          description: "Choose your playstyle",
          reward: "Obtain legendary weapon skin",
        },
        {
          title: "Invite Friends",
          description: "Invite companions to join you",
          reward: "Start empire expansion",
        },
      ],
      stories: [
        {
          title: "The Fall of the Ancient Kingdom",
          content: "A thousand years ago, there was a great kingdom that ruled this land. They gained infinite power through the Crystal of Light, but greed brought their doom...",
        },
        {
          title: "The Forgotten Heroes",
          content: "When darkness came, five heroes rose. But even they could not stop the power of shadows, and they disappeared one by one...",
        },
        {
          title: "The Beginning of Prophecy",
          content: "The ancient prophecy reads: 'When darkness is at its deepest, one who follows the stars shall emerge to reclaim the light'...",
        },
      ],
      form: {
        nickname: "Nickname",
        nicknamePlaceholder: "Your in-game nickname",
        email: "Email",
        emailPlaceholder: "your@email.com",
        phone: "Phone Number (Optional)",
        phonePlaceholder: "123-456-7890",
        playstyle: "Preferred Playstyle",
        warrior: "Warrior",
        assassin: "Assassin",
        mage: "Mage",
        referralTitle: "Your Referral Code",
        referralDescription: [
          "Invite friends and earn rewards together!",
          "1 exclusive skin per friend invited",
        ],
        copyCode: "Copy Code",
        next: "Next Step",
        complete: "Complete Registration",
      },
      messages: {
        fillRequired: "Please enter nickname and email",
        copySuccess: "Referral code copied!",
        copyError: "Failed to copy code. Please copy manually.",
        complete: "Pre-registration complete! Exclusive rewards have been added to your account.",
      },
    },
    footer: {
      tagline: ["In a world ruled by darkness,", "Write your legend."],
      quickLinks: "Quick Links",
      links: {
        story: "Story",
        characters: "Characters",
        rewards: "Pre-registration Benefits",
        community: "Community",
      },
      social: "Social Media",
      copyright: "© 2025 Realm of Shadows. All rights reserved.",
      terms: "Terms of Service",
      privacy: "Privacy Policy",
      cookies: "Cookie Policy",
    },
  },
  ja: {
    nav: {
      story: "ストーリー",
      characters: "キャラクター",
      rewards: "報酬",
      empire: "帝国",
      preregister: "事前登録",
    },
    hero: {
      title: "REALM OF SHADOWS",
      subtitle: "闇が支配する世界で、あなたの運命を切り開け。\n伝説のダークファンタジーRPGが間もなく登場。",
      cta: "今すぐ事前登録",
      counter: "現在",
      people: "名が登録済み",
    },
    story: {
      title: "闇に呑まれた王国",
      subtitle: "",
      description: [
        "千年の平和が崩れ、古代の呪いが大地を覆った。",
        "王国は滅び、生存者たちは影の中へ散らばった。",
        "今、あなたが英雄となり、失われた光を取り戻す番だ。",
      ],
      features: [
        {
          title: "没入型の世界観",
          description: "エルデンリングにインスパイアされた広大で暗いファンタジー世界を探索しよう。",
        },
        {
          title: "戦略的な戦闘",
          description: "タイミングと戦略が生存を決めるハードコアな戦闘システムを体験しよう。",
        },
        {
          title: "深いストーリー",
          description: "選択によって変わる複数のエンディングと隠された秘密を発見しよう。",
        },
      ],
    },
    characters: {
      title: "キャラクター選択",
      subtitle: "あなたのプレイスタイルに合った英雄を選ぼう",
      list: [
        {
          name: "闇の騎士",
          title: "Dark Knight",
          description: "かつては王国の守護者だったが、今は復讐の刃を振るう堕ちた戦士。圧倒的な近接戦闘力を誇る。",
        },
        {
          name: "影の暗殺者",
          title: "Shadow Assassin",
          description: "闇の中を動く存在。影から敵を奇襲し、痕跡なく消える致命的な暗殺者。",
        },
        {
          name: "炎の魔法使い",
          title: "Pyromancer",
          description: "禁じられた炎の魔法を扱う魔道士。遠くから敵を焼き、大規模な破壊を引き起こす強力な魔法使い。",
        },
      ],
      stats: {
        strength: "strength",
        agility: "agility",
        magic: "magic",
      },
    },
    rewards: {
      title: "事前登録限定報酬",
      subtitle: "",
      description: [
        "今すぐ登録して他のプレイヤーより先を行こう。",
        "初日から伝説の英雄としてスタート。",
      ],
      list: [
        {
          title: "限定キャラクタースキン",
          description: "事前登録者のみが獲得できる限定版「シャドウロード」スキン",
          tier: "伝説",
        },
        {
          title: "プレミアム通貨5000個",
          description: "ゲーム内のすべてのアイテムを購入できるプレミアム通貨",
          tier: "英雄",
        },
        {
          title: "「パイオニア」称号",
          description: "ゲーム世界の最初の英雄であることを証明する特別な称号",
          tier: "伝説",
        },
        {
          title: "7日間プレミアムパス",
          description: "リリース後7日間、すべてのプレミアム特典を無料提供",
          tier: "英雄",
        },
      ],
      earlyBird: {
        title: "アーリーバード特別ボーナス",
        description: "登録者50万人突破時、全登録者に",
        reward: "「黄金の竜の騎乗物」",
        current: "現在の登録者",
        target: "目標まで",
        remaining: "名",
      },
    },
    empire: {
      title: "私の帝国",
      subtitle: "",
      description: [
        "友達を招待して、あなただけの帝国を築こう。",
        "より多くの紹介者を集めるほど、より強力な報酬を獲得。",
      ],
      status: {
        title: "帝国の状況",
        you: "あなた（帝国の君主）",
        referrals: "直接紹介者",
        population: "総人口",
        level: "帝国レベル",
        recentReferrals: "最近の紹介者",
      },
      rewardsTiers: {
        title: "報酬段階",
        tiers: [
          {
            name: "ステージ1",
            requirement: "友達5人を招待",
            reward: "伝説の武器スキン",
          },
          {
            name: "ステージ2",
            requirement: "友達10人を招待",
            reward: "限定キャラクター衣装",
          },
          {
            name: "ステージ3",
            requirement: "友達20人を招待",
            reward: "黄金の王冠＋称号",
          },
          {
            name: "ステージ4",
            requirement: "友達50人を招待",
            reward: "神話級の騎乗物",
          },
          {
            name: "伝説",
            requirement: "友達100人を招待",
            reward: "帝国創設者称号",
          },
        ],
      },
      invite: "友達を招待",
    },
    reservation: {
      title: "事前登録",
      steps: [
        {
          title: "基本情報",
          description: "あなたの情報を入力してください",
          reward: "限定壁紙をアンロック",
        },
        {
          title: "ゲーム設定",
          description: "プレイスタイルを選択してください",
          reward: "伝説級武器スキン獲得",
        },
        {
          title: "友達を招待",
          description: "一緒に冒険する仲間を招待しよう",
          reward: "帝国拡張開始",
        },
      ],
      stories: [
        {
          title: "古代王国の崩壊",
          content: "千年前、この地を支配する偉大な王国があった。彼らは光の水晶を通じて無限の力を得たが、欲望が破滅を招いた...",
        },
        {
          title: "忘れられた英雄たち",
          content: "闇が訪れたとき、五人の英雄が立ち上がった。しかし彼らでさえ影の力を止められず、一人ずつ消えていった...",
        },
        {
          title: "予言の始まり",
          content: "古代の予言書にはこう記されている。「闇が最も深い時、星に従う者が現れ、光を取り戻すだろう」...",
        },
      ],
      form: {
        nickname: "ニックネーム",
        nicknamePlaceholder: "ゲーム内で使用するニックネーム",
        email: "メールアドレス",
        emailPlaceholder: "your@email.com",
        phone: "電話番号（任意）",
        phonePlaceholder: "090-0000-0000",
        playstyle: "好みのプレイスタイル",
        warrior: "戦士",
        assassin: "暗殺者",
        mage: "魔法使い",
        referralTitle: "あなたの紹介コード",
        referralDescription: [
          "友達を招待して一緒に報酬を獲得しよう！",
          "友達1人につき限定スキン1個付与",
        ],
        copyCode: "コードをコピー",
        next: "次のステップ",
        complete: "登録完了",
      },
      messages: {
        fillRequired: "ニックネームとメールアドレスを入力してください",
        copySuccess: "紹介コードをコピーしました！",
        copyError: "コードのコピーに失敗しました。手動でコピーしてください。",
        complete: "事前登録が完了しました！限定報酬がアカウントに付与されました。",
      },
    },
    footer: {
      tagline: ["闇が支配する世界で", "あなたの伝説を書き記せ。"],
      quickLinks: "クイックリンク",
      links: {
        story: "ストーリー",
        characters: "キャラクター",
        rewards: "事前登録特典",
        community: "コミュニティ",
      },
      social: "ソーシャルメディア",
      copyright: "© 2025 Realm of Shadows. All rights reserved.",
      terms: "利用規約",
      privacy: "プライバシーポリシー",
      cookies: "クッキーポリシー",
    },
  },
};
