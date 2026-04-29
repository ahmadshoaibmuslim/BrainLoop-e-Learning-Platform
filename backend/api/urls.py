from django.conf import settings
from api import views as api_views
from django.urls import path
# from .views import RegisterView, VerifyEmailView, ResendVerificationView
from .views import LearningModuleCreateView, LearningModuleApprovalView, check_approval_status

from rest_framework_simplejwt.views import TokenRefreshView

urlpatterns = [
    # Authentication Endpoints

    path("user/token/", api_views.MyTokenObtainPairView.as_view()),
    path("user/token/refresh/", TokenRefreshView.as_view()),
    path("user/register/", api_views.RegisterView.as_view()),
    path("user/password-reset/<email>/", api_views.PasswordResetEmailVerifyAPIView.as_view()),
    #  path('verify-email/<str:token>/', VerifyEmailView.as_view(), name='verify-email'),
    # path('resend-verification/', ResendVerificationView.as_view(), name='resend-verification'),
    path("user/password-change/", api_views.PasswordChangeAPIView.as_view()),
    path("user/profile/<user_id>/", api_views.ProfileAPIView.as_view()),
    path("user/change-password/", api_views.ChangePasswordAPIView.as_view()),

    # Core Endpoints
    path("course/category/", api_views.CategoryListAPIView.as_view()),
    path("course/course-list/", api_views.CourseListAPIView.as_view()),
    path("course/search/", api_views.SearchCourseAPIView.as_view()),
    path("course/course-detail/<slug>/", api_views.CourseDetailAPIView.as_view()),
    path("course/cart/", api_views.CartAPIView.as_view()),

    # path("book/cart/", api_views.BookCartAPIView.as_view()),
    
    path("course/cart-list/<cart_id>/", api_views.CartListAPIView.as_view()),
    path("cart/stats/<cart_id>/", api_views.CartStatsAPIView.as_view()),
    path("course/cart-item-delete/<cart_id>/<item_id>/", api_views.CartItemDeleteAPIView.as_view()),
    path("order/create-order/", api_views.CreateOrderAPIView.as_view()),
    path("order/checkout/<oid>/", api_views.CheckoutAPIView.as_view()),
    path("order/coupon/", api_views.CouponApplyAPIView.as_view()),
    path("payment/stripe-checkout/<order_oid>/", api_views.StripeCheckoutAPIView.as_view()),
    path("payment/payment-success/", api_views.PaymentSuccessAPIView.as_view()),
    # path("payment/jazzcash-checkout/<order_oid>/", api_views.JazzCashCheckoutAPIView.as_view()),



    # Student API Endpoints
    path("student/summary/<user_id>/", api_views.StudentSummaryAPIView.as_view()),
    path("student/course-list/<user_id>/", api_views.StudentCourseListAPIView.as_view()),
    path("student/course-detail/<user_id>/<enrollment_id>/", api_views.StudentCourseDetailAPIView.as_view()),
    path("student/course-completed/", api_views.StudentCourseCompletedCreateAPIView.as_view()),
    path("student/course-note/<user_id>/<enrollment_id>/", api_views.StudentNoteCreateAPIView.as_view()),
    path("student/course-note-detail/<user_id>/<enrollment_id>/<note_id>/", api_views.StudentNoteDetailAPIView.as_view()),
    path("student/rate-course/", api_views.StudentRateCourseCreateAPIView.as_view()),
    path("student/review-detail/<user_id>/<review_id>/", api_views.StudentRateCourseUpdateAPIView.as_view()),
    path("student/wishlist/<user_id>/", api_views.StudentWishListListCreateAPIView.as_view()),
    path("student/question-answer-list-create/<course_id>/", api_views.QuestionAnswerListCreateAPIView.as_view()),
    path("student/question-answer-message-create/", api_views.QuestionAnswerMessageSendAPIView.as_view()),

    # one to one mentoring
    path('mentoring-sessions/', api_views.MentoringSessionListView.as_view(), name='mentoring-session-list-create'),

    path('mentoring-sessions/<int:pk>/', api_views.MentoringSessionDetailAPIView.as_view(), name='mentoring-session-detail'),
    path('mentoring-sessions/upcoming/', api_views.UpcomingSessionsAPIView.as_view(), name='upcoming-sessions'),
    path('mentoring-sessions/past/', api_views.PastSessionsAPIView.as_view(), name='past-sessions'),


    # Teacher Routes
    path("teachers/", api_views.TeacherListView.as_view()),


    path("teacher/summary/<teacher_id>/", api_views.TeacherSummaryAPIView.as_view()),
    path("teacher/course-lists/<teacher_id>/", api_views.TeacherCourseListAPIView.as_view()),
    path("teacher/review-lists/<teacher_id>/", api_views.TeacherReviewListAPIView.as_view()),
    path("teacher/review-detail/<teacher_id>/<review_id>/", api_views.TeacherReviewDetailAPIView.as_view()),
    path("teacher/student-lists/<teacher_id>/", api_views.TeacherStudentsListAPIVIew.as_view({'get': 'list'})),
    path("teacher/all-months-earning/<teacher_id>/", api_views.TeacherAllMonthEarningAPIView),
    path("teacher/best-course-earning/<teacher_id>/", api_views.TeacherBestSellingCourseAPIView.as_view({'get': 'list'})),
    path("teacher/course-order-list/<teacher_id>/", api_views.TeacherCourseOrdersListAPIView.as_view()),
    path("teacher/question-answer-list/<teacher_id>/", api_views.TeacherQuestionAnswerListAPIView.as_view()),
    path("teacher/coupon-list/<teacher_id>/", api_views.TeacherCouponListCreateAPIView.as_view()),
    path("teacher/coupon-detail/<teacher_id>/<coupon_id>/", api_views.TeacherCouponDetailAPIView.as_view()),
    path("teacher/noti-list/<teacher_id>/", api_views.TeacherNotificationListAPIView.as_view()),
    path("teacher/noti-detail/<teacher_id>/<noti_id>", api_views.TeacherNotificationDetailAPIView.as_view()),
    path("teacher/course-create/", api_views.CourseCreateAPIView.as_view()),
    path("teacher/course-update/<teacher_id>/<course_id>/", api_views.CourseUpdateAPIView.as_view()),
    path("teacher/course-detail/<course_id>/", api_views.CourseDetailAPIView.as_view()),
    path("teacher/course/variant-delete/<variant_id>/<teacher_id>/<course_id>/", api_views.CourseVariantDeleteAPIView.as_view()),
    path("teacher/course/variant-item-delete/<variant_id>/<variant_item_id>/<teacher_id>/<course_id>/", api_views.CourseVariantItemDeleteAPIVIew.as_view()),

    # Teacher application 
    path("learning-modules/", LearningModuleCreateView.as_view(), name="learning-module-create"),
    path("learning-modules/<int:pk>/approve/", LearningModuleApprovalView.as_view(), name="learning-module-approve"),
    path("learning-modules/<int:module_id>/status/", check_approval_status, name="learning-module-status"),

    # Books
    path('books/', api_views.BookListCreateView.as_view(), name='book-list'),
    path('books/create/', api_views.BookCreateAPIView.as_view(), name='book-create'),

    path('books/<int:pk>/', api_views.BookDetailView.as_view(), name='book-detail'),
    path('books/purchase/', api_views.BookPurchaseView.as_view(), name='book-purchase'),
    
    path("books/books-detail/<int:id>/", api_views.BookDetailView.as_view()),

    path('recommend-courses/<int:course_id>/', api_views.recommend_courses, name='recommend_courses'),
    
    path('books/<int:book_id>/preview/', api_views.preview_book, name='preview_book'),
    path('books/<int:book_id>/recommendations/', api_views.category_based_recommendations, name='category_recommendations'),
    # path("recommended-books/<int:book_id>/", api_views.recommended_books, name="recommended-books"),



]
