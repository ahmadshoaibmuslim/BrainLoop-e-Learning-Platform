import Swal from "sweetalert2";

function toast(){
    const toastInstance = Swal.mixin({
        toast:true,
        position: "top",
        showConfirmButton: false,
        timer: 1500,
        timerProgressBar: true,

    })

    return toastInstance
}

// Add helper methods as properties of toast function
toast.success = (msg) => toast().fire({icon:'success', title: msg});
toast.error = (msg) => toast().fire({icon:'error', title: msg});

export default toast;