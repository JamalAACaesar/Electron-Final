<script>
    import { link } from 'svelte-spa-router'

    let user_list = []
    

    function handleSubmit() {
        const unsub = Admin.subscribe(value => {
        user_list = value
    })

const entry = {
    id: user_list.length + 1,
    ...user
}

user_list.push(entry)

Administrator(user_list)
}
</script>

<style>
    .wrapper {
    height: 100%;
    display: grid;
    place-content: center;
    }

    .form-signin {
    width: 100%;
    max-width: 330px;
    padding: 15px;
    margin: auto;
    }
    .form-signin .checkbox {
    font-weight: 400;
    }
    .form-signin .form-control {
    position: relative;
    box-sizing: border-box;
    height: auto;
    padding: 10px;
    font-size: 16px;
    }
    .form-signin .form-control:focus {
    z-index: 2;
    }
    .form-signin input[type="email"] {
    margin-bottom: -1px;
    border-bottom-right-radius: 0;
    border-bottom-left-radius: 0;
    }
    .form-signin input[type="password"] {
    margin-bottom: 10px;
    border-top-left-radius: 0;
    border-top-right-radius: 0;
    }
</style>

<div class="wrapper">
    <div class="container">
      <a class="btn btn-primary" style="margin-bottom: 20px; margin-top:200px" use:link={'/'}>Go Back</a>

        <div class="form-signin">
            <form on:submit|preventDefault={handleSubmit}>
              <h1 class="h3 mb-3 fw-normal">Register Here</h1>

              <div class="mb-3">
                <div class="row">
                    <div class="col">
                      <input type="text" class="form-control" placeholder="First name" aria-label="First name">
                    </div>
                    <div class="col">
                      <input ype="text" class="form-control" placeholder="Last name" aria-label="Last name">
                    </div>
                  </div>
            </div>
              
              <div class="mb-3">
                <label for="inputEmail" class="visually-hidden">Email address</label>
                <input type="email" id="inputEmail" class="form-control" placeholder="Email address" required="" autofocus="">
              </div>

              <div class="mb-3">
                <label for="inputPassword" class="visually-hidden">Password</label>
                <input type="password" id="inputPassword" class="form-control" placeholder="Password" required="">
              </div>

              


              <div class="checkbox mb-3">
                <label>
                  <input type="checkbox" value="remember-me"> Remember me
                </label>
              </div>
              <button class="w-100 btn btn-lg btn-primary" type="submit">Register User</button>
            </form>
          </div>
    </div>
</div>