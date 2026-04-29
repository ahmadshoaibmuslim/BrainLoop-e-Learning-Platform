from django.db import models
from userauths.models import User, Profile
from django.utils.text import slugify


from shortuuid.django_fields import ShortUUIDField

from django.utils import timezone

try:
    from moviepy import VideoFileClip
except ImportError:
    VideoFileClip = None

import math
from django.db.models import Avg


# Create your models here.

LANGUAGE = (
    ("English", "English"),
    ("Spanish", "Spanish"),
    ("French", "French"),
)

LEVEL = (
    ("Beginner", "Beginner"),
    ("Intermediate", "Intermediate"),
    ("Advanced", "Advanced"),
)

RATING = (
    (1, "1 star"),
    (2, "2 star"),
    (3, "3 star"),
    (4, "4  star"),
    (5, "5 star"),
)

TEACHER_STATUS = (
    ("Draft", "Draft"),
    ("Disabled", "Disabled"),
    ("Published", "Published"),
)

NOTI_TYPE = (
    ("New Order", "New Order"),
    ("New Review", "New Review"),
    ("New Course Question", "New Course Question"),
    ("Draft", "Draft"),
    ("Course Published", "Course Published"),
    ("Course Enrollment Completed", "Course Enrollment Completed"),
)


PAYMENT_STATUS = (
    ("Paid", "Paid"),
    ("Processing", "Processing"),
    ("Failed", "Failed"),
)

PLATFORM_STATUS = (
    ("Review", "Review"),
    ("Disabled", "Disabled"),
    ("Rejected", "Rejected"),
    ("Draft", "Draft"),
    ("Published", "Published"),
)


class Teacher(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    image = models.FileField(upload_to="course-file", blank=True, null=True, default="default.jpg")
    full_name = models.CharField(max_length=100)
    bio = models.CharField(max_length=100, null=True, blank=True)
    facebook = models.URLField(null=True, blank=True)
    twitter = models.URLField(null=True, blank=True)
    linkedin = models.URLField(null=True, blank=True)
    about = models.TextField(null=True, blank=True)
    country = models.CharField(blank=True, null=True, max_length=100)
    expertise = models.CharField(max_length=255, null=True, blank=True)  # New field



    def __str__(self):
        return self.full_name
    
    def students(self):
        return CartOrderItem.objects.filter(teacher = self)
    
    def courses(self):
        return Course.objects.filter(teacher = self)
    
    def reviews(self):
        return Course.objects.filter(teacher = self).count()
    

class Category(models.Model):
    title = models.CharField(max_length=100)
    image = models.FileField(upload_to="course-file", default="category.jpg", null=True, blank=True)
    active = models.BooleanField(default=True)
    slug = models.SlugField(unique=True, null=True, blank=True)

    class Meta:
        verbose_name_plural = "Category"
        ordering = ['title']

    def __str__(self):
        return self.title
    
    def course_count(self):
        return Course.objects.filter(category=self).count()

    
    def save(self, *args, **kwargs):
        if not self.slug:
            base_slug = slugify(self.title)
            self.slug = base_slug
            counter = 1
            while Category.objects.exclude(pk=self.pk).filter(slug=self.slug).exists():
                self.slug = f"{base_slug}-{counter}"
                counter += 1
        super(Category, self).save(*args, **kwargs)


class Course(models.Model):
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, blank=True)
    teacher = models.ForeignKey(Teacher, on_delete=models.CASCADE)
    file = models.FileField(upload_to="course-file", blank=True, null=True)
    image = models.FileField(upload_to="course-file", blank=True, null=True)
    title = models.CharField(max_length=200)
    description = models.TextField(null=True, blank=True)
    price = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    language = models.CharField(choices=LANGUAGE, default="English", max_length=100)
    level = models.CharField(choices=LEVEL, default="Beginner", max_length=100)
    platform_status = models.CharField(choices=PLATFORM_STATUS, default="Published", max_length=100)
    teacher_course_status = models.CharField(choices=TEACHER_STATUS, default="Published", max_length=100)
    featured = models.BooleanField(default=False)
    course_id = ShortUUIDField(unique=True, length=6, max_length=20, alphabet="1234567890")
    slug = models.SlugField(unique=True, null=True, blank=True)
    date = models.DateTimeField(default=timezone.now)
    tags = models.TextField(default="Programming")

    def __str__(self):
        return self.title
    
    def save(self, *args, **kwargs):
        if not self.slug:
            base_slug = slugify(self.title)
            self.slug = base_slug
            counter = 1
            while Course.objects.exclude(pk=self.pk).filter(slug=self.slug).exists():
                self.slug = f"{base_slug}-{counter}"
                counter += 1
        super(Course, self).save(*args, **kwargs)

    def students(self):
        return EnrolledCourse.objects.filter(course=self)
    
    def curriculum(self):
        return Variant.objects.filter(course=self)
    
    def lectures(self):
        return VariantItem.objects.filter(variant__course=self)
    
    def average_rating(self):
        average_rating = Review.objects.filter(course=self, active=True).aggregate(avg_rating=models.Avg('rating'))
        return average_rating['avg_rating']
    
    def rating_count(self):
        return Review.objects.filter(course=self, active=True).count()
    
    def reviews(self):
        return Review.objects.filter(course=self, active=True)


class Variant(models.Model):
    course = models.ForeignKey(Course, on_delete=models.CASCADE)
    title = models.CharField(max_length=1000)
    varient_id = ShortUUIDField(unique = True, length = 6, max_length= 20, alphabet= "1234567890")
    date = models.DateTimeField(default=timezone.now)


    def __str__(self):
        return self.title
    
    def variant_items(self):
        return VariantItem.objects.filter(variant=self)

    

class VariantItem(models.Model):
    variant = models.ForeignKey(Variant, on_delete=models.CASCADE,related_name="variant_items")
    title = models.CharField(max_length=1000)
    description = models.TextField(null=True, blank=True)
    file = models.FileField(upload_to="course-file", blank=True, null=True)
    duration = models.DurationField(null=True, blank=True)
    content_duration = models.CharField(max_length=1000, null=True, blank=True)
    preview = models.BooleanField(default=False)
    variant_item_id = ShortUUIDField(unique= True, length= 6, max_length=20, alphabet= "1234567890")
    date = models.DateTimeField(default=timezone.now)


    def __str__(self):
        return f"{self.variant.title} - {self.title}"

    

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)

        if self.file and VideoFileClip is not None:
            try:
                clip = VideoFileClip(self.file.path)
                duration_seconds = clip.duration

                minutes, reminder = divmod(duration_seconds, 60)
                minutes = math.floor(minutes)
                seconds = math.floor(reminder)

                duration_text = f"{minutes}m {seconds}s"
                self.content_duration = duration_text
                super().save(update_fields=['content_duration'])
            except Exception:
                # If moviepy is unavailable or processing fails, leave content_duration blank.
                pass


class Question_Answer(models.Model):
    course = models.ForeignKey(Course, on_delete=models.CASCADE)
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    title = models.CharField(max_length=1000, null=True, blank=True)
    qa_id = ShortUUIDField(unique=True, length =6, max_length=20, alphabet="1234567890")
    date = models.DateTimeField(default=timezone.now)


    def __str__(self):
        return f"{self.user.username} - {self.course.title}"
    
    class Meta:
        ordering = ['-date']

    def messages(self):
        return Question_Answer_Message.objects.filter(question = self)
    
    def profile(self):
        return Profile.objects.get(user = self.user)
    

class Question_Answer_Message(models.Model):
    course = models.ForeignKey(Course, on_delete=models.CASCADE)
    question = models.ForeignKey(Question_Answer, on_delete=models.CASCADE)
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    message = models.TextField(blank=True, null=True)
    qam_id = ShortUUIDField(unique=True, length =6, max_length=20, alphabet="1234567890")
    qa_id = ShortUUIDField(unique=True, length =6, max_length=20, alphabet="1234567890")
    date = models.DateTimeField(default=timezone.now)

    
    def __str__(self):
        return f"{self.user.username} - {self.course.title}"
    
    class Meta:
        ordering = ['date']

    def profile(self):
        return Profile.objects.get(user = self.user)

    
class Cart(models.Model):
    course = models.ForeignKey(Course, on_delete=models.CASCADE, null = True)
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    price = models.DecimalField(max_digits=12, default=0.00, decimal_places=2)
    tax_fee = models.DecimalField(max_digits=12, default=0.00, decimal_places=2)
    total = models.DecimalField(max_digits=12, default=0.00, decimal_places=2)
    country = models.CharField(max_length=100, null=True, blank=True)
    cart_id = ShortUUIDField(length=6, max_length = 20, alphabet = "1234567890")
    date = models.DateTimeField(default=timezone.now)


    def __str__(self):
        return self.course.title
    

class Test(models.Model):
    name = models.CharField(max_length=200)
    age = models.IntegerField(null=True, blank=True)

    def __str__(self):
        return self.name
    


class CartOrder(models.Model):
    student = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    teachers = models.ManyToManyField(Teacher, blank=True)
    sub_total = models.DecimalField(max_digits=12, default=0.00, decimal_places=2)
    tax_fee = models.DecimalField(max_digits=12, default=0.00, decimal_places=2)
    total = models.DecimalField(max_digits=12, default=0.00, decimal_places=2)
    initial_total = models.DecimalField(max_digits=12, default=0.00, decimal_places=2)
    saved = models.DecimalField(max_digits=12, default=0.00, decimal_places=2)
    payment_status = models.CharField(choices=PAYMENT_STATUS, default="Processing", max_length=200)
    full_name = models.CharField(max_length=100, null=True, blank=True)
    email = models.CharField(max_length=100, null=True, blank=True)
    country = models.CharField(max_length=100, null=True, blank=True)
    coupons = models.ManyToManyField("api.Coupon", blank=True)
    stripe_session_id = models.CharField(max_length=1000, null=True, blank=True)
    oid = ShortUUIDField(unique=True, length =6, max_length= 20, alphabet= "1234567890")
    date = models.DateTimeField(default=timezone.now)
    
    class Meta:
      ordering = ['-date']

    def order_items(self):
        return CartOrderItem.objects.filter(order = self)
    
    def __str__(self):
        return self.oid
    

class CartOrderItem(models.Model):
    order= models.ForeignKey(CartOrder, on_delete=models.CASCADE, related_name="orderitem")
    course= models.ForeignKey(Course, on_delete=models.CASCADE, related_name="order_item")
    teacher= models.ForeignKey(Teacher, on_delete=models.CASCADE)
    tax_fee = models.DecimalField(max_digits=12, default=0.00, decimal_places= 2)
    total = models.DecimalField(max_digits=12, default=0.00, decimal_places= 2)
    initial_total = models.DecimalField(max_digits=12, default=0.00, decimal_places= 2)
    saved = models.DecimalField(max_digits=12, default=0.00, decimal_places= 2)
    # coupons = models.ManyToManyField("api.Coupon", on_delete=models.SET_NULL, blank=True, null=True)
    applied_coupon = models.BooleanField(default=False)
    oid = ShortUUIDField(unique=True, length =6, max_length= 20, alphabet= "1234567890")
    date = models.DateTimeField(default=timezone.now)

    class Meta:
      ordering = ['-date']

    def order_id(self):
        return f"Ordre ID #{self.order.oid}"
    def payment_status(self):
        return f"{self.order.payment_status}"
    
    def __str__(self):
        return self.oid
        

class Certificate(models.Model):
    course= models.ForeignKey(Course, on_delete=models.CASCADE)
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    certificate_id = ShortUUIDField(unique=True, length =6, max_length= 20, alphabet= "1234567890")
    date = models.DateTimeField(default=timezone.now)
    
    def __str__(self):
        return self.course.title
        

class CompletedLesson(models.Model):
    course= models.ForeignKey(Course, on_delete=models.CASCADE)
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    variant_item = models.ForeignKey(VariantItem, on_delete=models.CASCADE)
    date = models.DateTimeField(default=timezone.now)
    
    def __str__(self):
        return self.course.title
        

class EnrolledCourse(models.Model):
    course= models.ForeignKey(Course, on_delete=models.CASCADE)
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    teacher = models.ForeignKey(Teacher, on_delete=models.SET_NULL, null=True, blank=True)
    order_item = models.ForeignKey(CartOrderItem, on_delete=models.CASCADE)
    enrollment_id = ShortUUIDField(unique=True, length =6, max_length= 20, alphabet= "1234567890")
    date = models.DateTimeField(default=timezone.now)
    
    def __str__(self):
        return self.course.title
        
    def lectures(self):
        return VariantItem.objects.filter(variant__course= self.course)
    
    def completed_lessons(self):
        return CompletedLesson.objects.filter(course= self.course, user= self.user)
    
    def curriculum(self):
        return Variant.objects.filter(course=self.course)

    
    def note(self):
        return Note.objects.filter(course = self.course, user = self.user)
    
    def question_answer(self):
        return Question_Answer.objects.filter(course= self.course)
    
    def review(self):
        return Review.objects.filter(course= self.course, user = self.user).first()
    

class Note(models.Model):
    title = models.CharField(max_length=1000, null=True, blank=True)
    date = models.DateTimeField(default=timezone.now)
    course= models.ForeignKey(Course, on_delete=models.CASCADE)
    note = models.TextField()
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    note_id = ShortUUIDField(unique = True, length=6, max_length=20, alphabet= "1234567890")

    def __str__(self):
        return self.title
    
class Review(models.Model):
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    course = models.ForeignKey(Course, on_delete=models.CASCADE)
    review = models.TextField()
    rating = models.IntegerField(choices=RATING, default=None)
    active = models.BooleanField(default=False)
    date = models.DateTimeField(default=timezone.now)   
    reply = models.TextField(null=True, blank=True, max_length=1000)

    def __str__(self):
        return self.course.title
    
    def profile(self):
        return Profile.objects.get(user=self.user)


class Notification(models.Model):
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    teacher = models.ForeignKey(Teacher, on_delete=models.SET_NULL, null=True, blank=True)
    order = models.ForeignKey(CartOrder, on_delete=models.SET_NULL, null=True, blank=True)
    order_item = models.ForeignKey(CartOrderItem, on_delete=models.SET_NULL, null=True, blank=True)
    review = models.ForeignKey(Review, on_delete=models.SET_NULL, null=True, blank=True)
    type = models.CharField(max_length=1000, choices=NOTI_TYPE)
    seen = models.BooleanField(default=False)
    date = models.DateTimeField(default=timezone.now)

    def __str__(self):
        return self.type
    

class Coupon(models.Model):
    teacher = models.ForeignKey(Teacher, on_delete=models.SET_NULL, null=True, blank=True)
    used_by = models.ManyToManyField(User, blank=True)
    code = models.CharField(max_length=50)
    discount = models.IntegerField(default=1)
    active = models.BooleanField(default=False)
    date = models.DateTimeField(default=timezone.now)

    def __str__(self):
        return self.code
    

class WishList(models.Model):
    user= models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    Course = models.ForeignKey(Course, on_delete=models.CASCADE)

    def __str__(self):
        return f"{self.user.email} - {self.Course.title}"  # Example: "user@example.com - Course Title"    
    
class Country(models.Model):
    name = models.CharField(max_length=100)
    tax_rate = models.IntegerField(default=5)
    active = models.BooleanField(default=True)
    slug = models.SlugField(unique=True, blank=True, null=True)  # Add the slug field

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):  # Override the save method for slug logic
        if not self.slug:  # Ensure slug is set only if it's not already defined
            self.slug = slugify(self.name)  # Use name for the slug
        super(Country, self).save(*args, **kwargs) 

from django.conf import settings  # Import settings to access AUTH_USER_MODEL

class MentoringSession(models.Model):
    STATUS_CHOICES = [
        ('upcoming', 'Upcoming'),
        ('completed', 'Completed'),
        ('canceled', 'Canceled'),
    ]
    title = models.CharField(max_length=100)
    mentor = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        related_name="mentored_sessions"
    )
    student = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        related_name="student_sessions"
    )
    date = models.DateField()
    time = models.TimeField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='upcoming')
    join_link = models.URLField(null=True, blank=True)
    feedback = models.TextField(null=True, blank=True)
    rating = models.PositiveIntegerField(null=True, blank=True)
    goals = models.TextField(null=True, blank=True)
    resources = models.JSONField(null=True, blank=True)
    slug = models.SlugField(unique=True, null=True, blank=True)

    class Meta:
        verbose_name_plural = "Mentoring Sessions"
        ordering = ['date', 'time']

    def __str__(self):
        return f"{self.title} - {self.mentor} (Student: {self.student})"

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(f"{self.title}-{self.mentor}-{self.date}-{self.time}")
        super(MentoringSession, self).save(*args, **kwargs)


# Teacher application 

class LearningModule(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)

    title = models.CharField(max_length=255)
    category = models.CharField(max_length=255)
    time_commitment = models.CharField(max_length=50)
    learning_objectives = models.JSONField()
    intended_learners = models.JSONField()
    prerequisites = models.JSONField()
    is_approved = models.BooleanField(default=False)  # New field for approval
    feedback = models.TextField(blank=True, null=True)  # Admin feedback

    def __str__(self):
        return self.title




# Books Backend

class Book(models.Model):
    CATEGORY_CHOICES = [
        ('Technology', 'Technology'),
        ('Adventure', 'Adventure'),
        ('Science', 'Science'),
        ('History', 'History'),
        ('Web Development', 'Web Development'),
        ('AI', 'AI'),
        ('ML', 'ML'),
        ('Python', 'Python'),
        ('Mobile App', 'Mobile App'),
        ('Deep Learning', 'Deep Learning'),


    ]
    
    title = models.CharField(max_length=255)
    author = models.CharField(max_length=255)
    description = models.TextField()
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES)
    price = models.DecimalField(max_digits=6, decimal_places=2)
    uploaded_by = models.ForeignKey(User, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    image = models.FileField(upload_to="book_images/", blank=True, null=True)
    preview_url = models.URLField(blank=True, null=True)
    total_pages = models.IntegerField(null=True)
    preview_pages = models.IntegerField(default=5)  # Allow preview of first 5 pages
    pdf_file = models.FileField(upload_to='books/', null=True, blank=True)

    def __str__(self):
        return self.title
    
class BookPurchase(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    book = models.ForeignKey(Book, on_delete=models.CASCADE)
    purchased_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} - {self.book.title}"