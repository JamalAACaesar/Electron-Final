<script>
    export let params = {}
    import { link } from 'svelte-spa-router'
    import { employees, UpdateEmployees } from '../stores'


    let emp_list = [] 
    
    const unsub = employees.subscribe(value => {
        emp_list = value
    })

    const id = params.id

    const employee = emp_list.find(i => i.id === Number(id))

    function handleSubmit() {
        UpdateEmployees(emp_list)
    }
</script>



<style>
	.wrapper {
		height: 100%;
		display: grid;
		place-content: center;
	}
</style>

<div class="wrapper">
	<div class="container">

    <a class="btn btn-primary" style="margin-bottom: 20px; margin-top:200px" use:link={'/'}>Go Back</a>
        <h1 class="title mb-4">Update Employee: </h1>
        
        
        <!-- <p>
            Employee: {JSON.stringify(employee)}
        </p> -->

        
        <form on:submit|preventDefault={handleSubmit}>
            <div class="mb-3">
                <div class="row">
                    <div class="col">
                      <input bind:value={employee.first_name} type="text" class="form-control" placeholder="First name" aria-label="First name">
                    </div>
                    <div class="col">
                      <input bind:value={employee.last_name} type="text" class="form-control" placeholder="Last name" aria-label="Last name">
                    </div>
                  </div>
            </div>

            <div class="mb-3">
              <label class="form-label">Email address</label>
              <input bind:value={employee.email} type="email" class="form-control" id="exampleInputEmail1" aria-describedby="emailHelp">
              <div id="emailHelp" class="form-text">We'll never share your email with anyone else.</div>
            </div>

            <div class="mb-3">
              <label class="form-label">Rank</label>
              <input bind:value={employee.rank} class="form-control">
            </div>

            <div class="mb-3">
              <label class="form-label">Work Started</label>
              <input type="date" bind:value={employee.work_started} class="form-control">
            </div>

            <div class="mb-3">
              <label  class="form-label">Shift Hours</label>
              <input type="text" bind:value={employee.shift_hours} class="form-control">
            </div>
            
            
            <button type="submit" class="btn btn-primary">Update</button>
          </form>
	</div>
</div>

