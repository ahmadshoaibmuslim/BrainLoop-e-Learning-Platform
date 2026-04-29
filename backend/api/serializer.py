from django.contrib.auth.password_validation import validate_password
from api import models as api_models
import json

from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from userauths.models import Profile, User
from .models import LearningModule

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
    class Meta:
        model = User
        fields = '__all__'


class ProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = Profile
        fields = "__all__"


class CategorySerializer(serializers.ModelSerializer):

    class Meta:
        fields = ['id', 'title', 'image', 'slug', 'course_count']
        model = api_models.Category

class TeacherSerializer(serializers.ModelSerializer):

    class Meta:
        fields = [ "user", "image", "full_name", "bio", "facebook", "twitter", "linkedin", "about", "country", "students", "courses", "review",]
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

    class Meta:
        fields = '__all__'
        model = api_models.Question_Answer_Message


class Question_AnswerSerializer(serializers.ModelSerializer):
    messages = Question_Answer_MessageSerializer(many=True)
    profile = ProfileSerializer(many=False)
    
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
    students = EnrolledCourseSerializer(many=True, required=False, read_only=True,)
    curriculum = VariantSerializer(many=True, required=False, read_only=True,)
    lectures = VariantItemSerializer(many=True, required=False, read_only=True,)
    reviews = ReviewSerializer(many=True, read_only=True, required=False)
    file_url = serializers.SerializerMethodField()
    image_url = serializers.SerializerMethodField()
    
    class Meta:
        fields = ["id", "category", "teacher", "file", "image", "file_url", "image_url", "title", "description", "price", "language", "level", "platform_status", "teacher_course_status", "featured", "course_id", "slug", "date", "students", "curriculum", "lectures", "average_rating", "rating_count", "reviews",]
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
    total_revenue = serializers.IntegerField(default=0)
    monthly_revenue = serializers.IntegerField(default=0)

class TeacherSerializer(serializers.ModelSerializer):
    class Meta:
        model = api_models.Teacher
        fields = ['id','full_name', 'expertise']



class WishlistSerializer(serializers.ModelSerializer):

    class Meta:
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


class MentoringSessionSerializer(serializers.ModelSerializer):
    class Meta:
        model = api_models.MentoringSession
        fields = [
            'id', 'title', 'mentor', 'student', 'date', 'time', 'status', 
            'join_link', 'feedback', 'rating', 'goals', 'resources', 'slug'
        ]
        extra_kwargs = {
            'mentor': {'required': True},
            'student': {'required': True},
        }


# Books 

class BookSerializer(serializers.ModelSerializer):
    image = serializers.SerializerMethodField()

    class Meta:
        model = api_models.Book
        fields = '__all__'

    def get_image_url(self, obj):
        request = self.context.get('request')
        if obj.image:
            return request.build_absolute_uri(obj.image.url)  # Full URL for React
        return None
    
    def get_image(self, obj):
        request = self.context.get("request")
        if obj.image:
            return request.build_absolute_uri(obj.image.url)
        return None
    
class BookPurchaseSerializer(serializers.ModelSerializer):
    class Meta:
        model = api_models.BookPurchase
        fields = '__all__'

