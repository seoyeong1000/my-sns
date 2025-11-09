graph TD
    Start([사용자 방문]) --> Auth{인증 상태}
    
    Auth -->|미인증| SignIn[로그인/회원가입 페이지]
    SignIn --> ClerkAuth[Clerk 인증]
    ClerkAuth --> Home
    
    Auth -->|인증됨| Home[홈 피드 /]
    
    %% 홈 피드 흐름
    Home --> ViewFeed[게시물 피드 조회]
    ViewFeed --> FeedActions{사용자 액션}
    
    %% 게시물 상호작용
    FeedActions -->|좋아요| Like[❤️ 좋아요 토글]
    Like --> ViewFeed
    
    FeedActions -->|댓글| Comment[💬 댓글 작성]
    Comment --> ViewFeed
    
    FeedActions -->|게시물 클릭| PostDetail[게시물 상세 모달]
    PostDetail --> PostDetailActions{액션}
    PostDetailActions -->|댓글 작성| AddComment[댓글 추가]
    PostDetailActions -->|닫기| ViewFeed
    PostDetailActions -->|삭제본인만| DeletePost[게시물 삭제]
    DeletePost --> ViewFeed
    
    %% 게시물 작성
    FeedActions -->|➕ 만들기| CreatePost[게시물 작성 모달]
    CreatePost --> UploadImage[이미지 업로드]
    UploadImage --> WriteCaption[캡션 작성]
    WriteCaption --> SubmitPost[게시]
    SubmitPost --> ViewFeed
    
    %% 프로필 흐름
    FeedActions -->|👤 프로필| ProfileMenu{프로필 선택}
    ProfileMenu -->|내 프로필| MyProfile[내 프로필 /profile]
    ProfileMenu -->|다른 사용자| OtherProfile[사용자 프로필 /profile/userId]
    
    MyProfile --> ViewMyPosts[내 게시물 그리드]
    ViewMyPosts --> ClickMyPost[게시물 클릭]
    ClickMyPost --> PostDetail
    
    OtherProfile --> ProfileActions{프로필 액션}
    ProfileActions -->|팔로우| Follow[팔로우/언팔로우]
    Follow --> OtherProfile
    
    ProfileActions -->|게시물 보기| ViewUserPosts[사용자 게시물 그리드]
    ViewUserPosts --> ClickUserPost[게시물 클릭]
    ClickUserPost --> PostDetail
    
    %% 무한 스크롤
    ViewFeed -.->|스크롤 하단| LoadMore[추가 게시물 로드]
    LoadMore --> ViewFeed
    
    %% 반응형 네비게이션
    Home -.->|모바일| BottomNav[하단 네비게이션]
    Home -.->|데스크탑/태블릿| Sidebar[사이드바]
    
    style Start fill:#e1f5ff
    style Home fill:#fff3cd
    style CreatePost fill:#d4edda
    style MyProfile fill:#f8d7da
    style Follow fill:#d1ecf1
    style Like fill:#ff6b9d
    style Comment fill:#c3e6cb