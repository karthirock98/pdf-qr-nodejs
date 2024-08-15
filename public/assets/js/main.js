$(document).ready(function () {
    const allowedMimeTypes = ['']
    $('#upload-pdf-form').on('submit', (e) => {
        
        const fileInput = document.getElementById('file')
        if( fileInput.files.length === 0 ){
            alert('Please select a file')
            e.preventDefault();
            return false;
        }
    })

    $('#file').on('change', function (e)  {
        const file = this.files[0];
        if(file && file.type != 'application/pdf'){
            alert('Select .pdf files only.')
            $(this).val('')
        }else{
            
        }
    })
});
