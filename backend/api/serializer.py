from django.contrib.auth.password_validation import validate_password
from api import models as api_models
import json

from django.contrib.auth import get_user_model
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from userauths.models import Profile
from .models import LearningModule

User = get_user_model()

class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)

        token['full_name'] = user.full_name
        token['email'] = user.email
        token['username'] = user.username
        try:
            token['teacher_id'] = user.teacher.id
        except:
            token['teacher_id'] = 0


        return token

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = User
        fields = ['full_name', 'email', 'password', 'password2']

    def validate(self, attr):
        if attr['password'] != attr['password2']:
            raise serializers.ValidationError({"password": "Password fields didn't match."})

        return attr
    
    def create(self, validated_data):
        user = User.objects.create(
            full_name=validated_data['full_name'],
            email=validated_data['email'],
        )

        email_username, _ = user.email.split("@")
        user.username = email_username
        user.set_password(validated_data['password'])
        user.save()

        return user
    
    
class UserSerializer(serializers.ModelSerializer):
    teacher_id = serializers.SerializerMethodField()
    
    def get_teacher_id(self, obj):
        try:
            return obj.teacher.id
        except:
            return None
    
    class Meta:
        model = User
        fields = ('id', 'username', 'full_name', 'email', 'teacher_id')


class MentoringSessionSerializer(serializers.ModelSerializer):
    teacher = UserSerializer(read_only=True)
    student = UserSerializer(read_only=True)
    teacher_name = serializers.CharField(source='teacher.full_name', read_only=True)
    student_name = serializers.CharField(source='student.full_name', read_only=True)
    teacher_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(),
        source='teacher',
        write_only=True
    )
    student_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(),
        source='student',
        write_only=True,
        required=False
    )

    class Meta:
        model = api_models.MentoringSession
        fields = [
            'id',
            'teacher',
            'teacher_name',
            'student',
            'student_name',
            'teacher_id',
            'student_id',
            'topic',
            'start_time',
            'duration',
            'status',
            'zoom_meeting_id',
            'join_url',
            'created_at',
        ]
        read_only_fields = [
            'id',
            'teacher',
            'teacher_name',
            'student',
            'student_name',
            'status',
            'zoom_meeting_id',
            'join_url',
            'created_at',
        ]


class ProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    teacher_id = serializers.SerializerMethodField()
    application_status = serializers.SerializerMethodField()
    
    def get_teacher_id(self, obj):
        """Get teacher ID if user has a teacher profile"""
        try:
            return obj.user.teacher.id
        except:
            return None
    
    def get_application_status(self, obj):
        """Get the latest learning module application status"""
        try:
            latest_application = LearningModule.objects.filter(user=obj.user).latest('id')
            return {
                'is_approved': latest_application.is_approved,
                'feedback': latest_application.feedback,
            }
        except LearningModule.DoesNotExist:
            return None
    
    class Meta:
        model = Profile
        fields = "__all__"


class CategorySerializer(serializers.ModelSerializer):

    class Meta:
        fields = ['id', 'title', 'image', 'slug', 'course_count']
        model = api_models.Category

class TeacherSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    teacher_name = serializers.SerializerMethodField()

    def get_teacher_name(self, obj):
        return obj.full_name or getattr(obj.user, 'full_name', None) or getattr(obj.user, 'username', None) or 'Unknown Teacher'

    class Meta:
        fields = ["id", "user", "teacher_name", "image", "full_name", "bio", "facebook", "twitter", "linkedin", "about", "country"]
        model = api_models.Teacher




class VariantItemSerializer(serializers.ModelSerializer):
    file_url = serializers.SerializerMethodField()
    
    class Meta:
        fields = '__all__'
        model = api_models.VariantItem

    def get_file_url(self, obj):
        if obj.file:
            if obj.file.url.startswith('http'):
                return obj.file.url
            return f"http://127.0.0.1:8000{obj.file.url}"
        return None
    
    def __init__(self, *args, **kwargs):
        super(VariantItemSerializer, self).__init__(*args, **kwargs)
        request = self.context.get("request")
        if request and request.method == "POST":
            self.Meta.depth = 0
        else:
            self.Meta.depth = 3


class VariantSerializer(serializers.ModelSerializer):
    variant_items = VariantItemSerializer(many=True, read_only=True)
    # items = VariantItemSerializer(many=True)
    class Meta:
        fields = '__all__'
        model = api_models.Variant


    def __init__(self, *args, **kwargs):
        super(VariantSerializer, self).__init__(*args, **kwargs)
        request = self.context.get("request")
        if request and request.method == "POST":
            self.Meta.depth = 0
        else:
            self.Meta.depth = 3




class Question_Answer_MessageSerializer(serializers.ModelSerializer):
    profile = ProfileSerializer(many=False)
    user_name = serializers.CharField(source='user.username', read_only=True)
    user_profile_image = serializers.SerializerMethodField()
    
    def get_user_profile_image(self, obj):
        request = self.context.get('request')
        if obj.user and obj.user.profile and obj.user.profile.image:
            url = obj.user.profile.image.url
            if request:
                return request.build_absolute_uri(url)
            return url
        return None

    class Meta:
        fields = '__all__'
        model = api_models.Question_Answer_Message


class Question_AnswerSerializer(serializers.ModelSerializer):
    messages = Question_Answer_MessageSerializer(many=True)
    profile = ProfileSerializer(many=False)
    user_name = serializers.CharField(source='user.username', read_only=True)
    course_title = serializers.CharField(source='course.title', read_only=True)
    course_image = serializers.SerializerMethodField()
    
    def get_course_image(self, obj):
        request = self.context.get('request')
        if obj.course and obj.course.image:
            url = obj.course.image.url
            if request:
                return request.build_absolute_uri(url)
            return url
        return None
    
    class Meta:
        fields = '__all__'
        model = api_models.Question_Answer



class CartSerializer(serializers.ModelSerializer):

    class Meta:
        fields = '__all__'
        model = api_models.Cart

    def __init__(self, *args, **kwargs):
        super(CartSerializer, self).__init__(*args, **kwargs)
        request = self.context.get("request")
        if request and request.method == "POST":
            self.Meta.depth = 0
        else:
            self.Meta.depth = 3


class CartOrderItemSerializer(serializers.ModelSerializer):

    class Meta:
        fields = '__all__'
        model = api_models.CartOrderItem

    def __init__(self, *args, **kwargs):
        super(CartOrderItemSerializer, self).__init__(*args, **kwargs)
        request = self.context.get("request")
        if request and request.method == "POST":
            self.Meta.depth = 0
        else:
            self.Meta.depth = 3


class CartOrderSerializer(serializers.ModelSerializer):
    order_items = CartOrderItemSerializer(many=True)
    
    class Meta:
        fields = '__all__'
        model = api_models.CartOrder


    def __init__(self, *args, **kwargs):
        super(CartOrderSerializer, self).__init__(*args, **kwargs)
        request = self.context.get("request")
        if request and request.method == "POST":
            self.Meta.depth = 0
        else:
            self.Meta.depth = 3

class CertificateSerializer(serializers.ModelSerializer):

    class Meta:
        fields = '__all__'
        model = api_models.Certificate



class CompletedLessonSerializer(serializers.ModelSerializer):

    class Meta:
        fields = '__all__'
        model = api_models.CompletedLesson


    def __init__(self, *args, **kwargs):
        super(CompletedLessonSerializer, self).__init__(*args, **kwargs)
        request = self.context.get("request")
        if request and request.method == "POST":
            self.Meta.depth = 0
        else:
            self.Meta.depth = 3

class NoteSerializer(serializers.ModelSerializer):

    class Meta:
        fields = '__all__'
        model = api_models.Note



class ReviewSerializer(serializers.ModelSerializer):
    profile = ProfileSerializer(source='Profile', many=False, read_only=True)

    class Meta:
        fields = '__all__'
        model = api_models.Review
        depth = 3  # Set default depth here

    def __init__(self, *args, **kwargs):   
        super(ReviewSerializer, self).__init__(*args, **kwargs)
        request = self.context.get("request")
        if request and request.method == "POST":
            self.Meta.depth = 0
        else:
            self.Meta.depth = 3

class NotificationSerializer(serializers.ModelSerializer):

    class Meta:
        fields = '__all__'
        model = api_models.Notification


class CouponSerializer(serializers.ModelSerializer):

    class Meta:
        fields = '__all__'
        model = api_models.Coupon


class WishList(serializers.ModelSerializer):

    class Meta:
        fields = '__all__'
        model = api_models.WishList

    def __init__(self, *args, **kwargs):
        super(WishList, self).__init__(*args, **kwargs)
        request = self.context.get("request")
        if request and request.method == "POST":
            self.Meta.depth = 0
        else:
            self.Meta.depth = 3

class CountrySerializer(serializers.ModelSerializer):

    class Meta:
        fields = '__all__'
        model = api_models.Country




class EnrolledCourseSerializer(serializers.ModelSerializer):
    lectures = VariantItemSerializer(many=True, read_only=True)
    completed_lessons = CompletedLessonSerializer(many=True, read_only=True)
    curriculum =  VariantSerializer(many=True, read_only=True)
    note = NoteSerializer(many=True, read_only=True)
    question_answer = Question_AnswerSerializer(many=True, read_only=True)
    review = ReviewSerializer(many=False, read_only=True)


    class Meta:
        fields = '__all__'
        model = api_models.EnrolledCourse

    def __init__(self, *args, **kwargs):
        super(EnrolledCourseSerializer, self).__init__(*args, **kwargs)
        request = self.context.get("request")
        if request and request.method == "POST":
            self.Meta.depth = 0
        else:
            self.Meta.depth = 3

class CourseSerializer(serializers.ModelSerializer):
    students = EnrolledCourseSerializer(many=True, required=False, read_only=True, source='enrolledcourse_set')
    total_students = serializers.SerializerMethodField()
    status = serializers.CharField(source='teacher_course_status')
    created_at = serializers.DateTimeField(source='date')
    curriculum = VariantSerializer(many=True, required=False, read_only=True,)
    lectures = VariantItemSerializer(many=True, required=False, read_only=True,)
    reviews = ReviewSerializer(many=True, read_only=True, required=False)
    file_url = serializers.SerializerMethodField()
    image_url = serializers.SerializerMethodField()
    
    class Meta:
        fields = ["id", "category", "teacher", "file", "image", "file_url", "image_url", "title", "description", "price", "language", "level", "platform_status", "teacher_course_status", "status", "featured", "course_id", "slug", "date", "created_at", "students", "total_students", "curriculum", "lectures", "average_rating", "rating_count", "reviews",]
        model = api_models.Course

    def get_file_url(self, obj):
        if obj.file:
            if obj.file.url.startswith('http'):
                return obj.file.url
            return f"http://127.0.0.1:8000{obj.file.url}"
        return None
    
    def get_image_url(self, obj):
        if obj.image:
            if obj.image.url.startswith('http'):
                return obj.image.url
            return f"http://127.0.0.1:8000{obj.image.url}"
        return None

    def get_total_students(self, obj):
        return obj.enrolledcourse_set.count()

    def __init__(self, *args, **kwargs):
        super(CourseSerializer, self).__init__(*args, **kwargs)
        request = self.context.get("request")
        if request and request.method == "POST":
            self.Meta.depth = 0
        else:
            self.Meta.depth = 3



class StudentSummarySerializer(serializers.Serializer):
    total_courses = serializers.IntegerField(default=0)
    completed_lessons = serializers.IntegerField(default=0)
    achieved_certificates = serializers.IntegerField(default=0)

class TeacherSummarySerializer(serializers.Serializer):
    total_courses = serializers.IntegerField(default=0)
    total_students = serializers.IntegerField(default=0)
    total_revenue = serializers.DecimalField(max_digits=12, decimal_places=2, default=0)
    monthly_revenue = serializers.DecimalField(max_digits=12, decimal_places=2, default=0)


class WishlistSerializer(serializers.ModelSerializer):

    # Expose a lowercase `course` field that maps to the model's `Course` FK
    course = CourseSerializer(source='Course', read_only=True)

    class Meta:
        # include the fields we need; keep all for backward compatibility
        fields = '__all__'
        model = api_models.WishList

    def __init__(self, *args, **kwargs):
        super(WishlistSerializer, self).__init__(*args, **kwargs)
        request = self.context.get("request")
        if request and request.method == "POST":
            self.Meta.depth = 0
        else:
            self.Meta.depth = 3

class StudentSummerySerializer(serializers.Serializer):
    total_courses = serializers.IntegerField(default=0)
    completed_lessons = serializers.IntegerField(default=0)
    achieved_certificates = serializers.IntegerField(default=0)

# Teacher application 
class LearningModuleSerializer(serializers.ModelSerializer):
    user = serializers.ReadOnlyField(source = "user.id")
    class Meta:
        model = LearningModule
        fields = '__all__'
        read_only_fields = ['is_approved', 'feedback']  # Users can't set approval statusy


class LearningModuleAdminSerializer(serializers.ModelSerializer):
    class Meta:
        model = LearningModule
        fields = ["is_approved", "feedback"] 


# Books 

class BookSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()
    uploaded_by = serializers.StringRelatedField(read_only=True)

    class Meta:
        model = api_models.Book
        fields = ['id', 'title', 'author', 'description', 'category', 'price', 'created_at', 'image', 'image_url', 'preview_url', 'total_pages', 'preview_pages', 'pdf_file', 'uploaded_by']
        read_only_fields = ['id', 'created_at', 'uploaded_by']

    def get_image_url(self, obj):
        request = self.context.get('request')
        if obj.image:
            return request.build_absolute_uri(obj.image.url)
        return None
    
class BookPurchaseSerializer(serializers.ModelSerializer):
    class Meta:
        model = api_models.BookPurchase
        fields = '__all__'

