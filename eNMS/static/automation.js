/*
global
addJobsToWorkflow: false
alertify: false
call: false
createPanel: false
diffview: false
displayWorkflow: false
fCall: false
getJobState: false
getWorkflowState: false
JSONEditor: false
jsPanel: false
nodes: true
page: false
showTypePanel: false
refreshTable: false
table: false
workflow: true
*/

let refreshJob = {};
let currentResults = {};

/**
 * Open service panel
 */
// eslint-disable-next-line
function openServicePanel() {
  showTypePanel($("#service-type").val());
}

/**
 * Custom code upon opening panel.
 * @param {type} type - Service or Workflow.
 */
// eslint-disable-next-line
function panelCode(type, id) {
  const typeInput = $(id ? `#${type}-class-${id}` : `#${type}-class`);
  typeInput.val(type).prop("disabled", true);
  $(id ? `#${type}-wizard-${id}` : `#${type}-wizard`).smartWizard({
    autoAdjustHeight: false,
    enableAllSteps: true,
    keyNavigation: false,
    transitionEffect: "none",
  });
  $(".buttonFinish,.buttonNext,.buttonPrevious").hide();
  $(id ? `#${type}-wizard-${id}` : `#${type}-wizard`).smartWizard("fixHeight");
}

/**
 * Save a service.
 * @param {service} service - Service instance.
 */
// eslint-disable-next-line
function saveService(service, id) {
  if (page == "workflow_builder") {
    if (id) {
      nodes.update({ id: id, label: service.name });
    } else {
      addJobsToWorkflow([service.id]);
    }
  }
}

/**
 * Save a service.
 * @param {service} service - Service instance.
 */
// eslint-disable-next-line
function copyResultsToClipboard(id) {
  $(`#display-text-${id}`).prop("checked", true);
  displayResult(id);
  let node = document.getElementById(`display_results-${id}`);
  if (document.body.createTextRange) {
    const range = document.body.createTextRange();
    range.moveToElementText(node);
    range.select();
  } else if (window.getSelection) {
    const selection = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(node);
    selection.removeAllRanges();
    selection.addRange(range);
  } else {
    alertify.notify("Selection not supported by your browser", "error", 5);
  }
  document.execCommand("copy");
}

/**
 * Save a workflow.
 * @param {workflow object} workflow - Workflow instance.
 */
// eslint-disable-next-line
function saveWorkflow(newWorkflow) {
  if (page == "workflow_builder") {
    $("#current-workflow").append(
      `<option value="${newWorkflow.id}">${newWorkflow.name}</option>`
    );
    $("#current-workflow").val(newWorkflow.id);
    $("#current-workflow").selectpicker("refresh");
    workflow = newWorkflow;
    displayWorkflow(workflow);
  }
}

/**
 * Parse object to break strings into list for JSON display.
 * @param {obj} obj - Object.
 * @return {obj}.
 */
function parseObject(obj) {
  for (let k in obj) {
    if (typeof obj[k] === "object" && obj[k] !== null) {
      parseObject(obj[k]);
    } else if (obj.hasOwnProperty(k) && typeof obj[k] === "string") {
      const lines = obj[k].replace(/(?:\\[rn]|[\r\n]+)+/g, "\n").split("\n");
      if (lines.length > 1) obj[k] = lines;
    }
  }
  return obj;
}

function formatResults(id, results) {
  if (!results) results = currentResults;
  if (!results) {
    $(`#display_results-${id}`).text("No results yet.");
  } else if ($(`input[name="type"]:checked`).val() == "json") {
    $(`#display_results-${id}`).empty();
    new JSONEditor(
      document.getElementById(`display_results-${id}`),
      { mode: "view" },
      parseObject(JSON.parse(JSON.stringify(results)))
    );
  } else {
    $(`#display_results-${id}`).html(
      `<pre>${JSON.stringify(
        Object.fromEntries(
          Object.entries(results)
            .sort()
            .reverse()
        ),
        null,
        2
      )
        .replace(/(?:\\[rn]|[\r\n]+)+/g, "\n")
        .replace(/\\"/g, `"`)
        .replace(/\\\\/g, "\\")}</pre>`
    );
  }
}

/**
 * Display result.
 * @param {id} id - Job id.
 * @param {results} results - Results.
 */
function displayResults(id, parentId) {
  fCall(`/get_job_results/${id}`, `#results-form-${parentId || id}`, (results) => {
    currentResults = results;
    formatResults(id, results);
  });
}

/**
 * Display results.
 * @param {id} id - Job id.
 */
function getTimestamps(id, isWorkflow) {
  call(`/get_job_timestamps/${id}`, (timestamps) => {
    $(`#timestamp-${id},#timestamp_compare-${id}`).empty();
    timestamps.forEach((timestamp) => {
      $(`#timestamp-${id},#timestamp_compare-${id}`).append(
        $("<option></option>")
          .attr("value", timestamp)
          .text(timestamp)
      );
    });
    mostRecent = timestamps[timestamps.length - 1];
    $(`#timestamp-${id},#timestamp_compare-${id}`).val(mostRecent);
    $(`#timestamp-${id},#timestamp_compare-${id}`).selectpicker("refresh");
    if (timestamps) {
      (isWorkflow ? updateWorkflowList : updateDeviceList)(id);
    }
  });
}

/**
 * Display results.
 * @param {id} id - Job id.
 */
function updateDeviceList(id, parentId) {
  fCall(`/get_results_device_list/${id}`, `#results-form-${parentId || id}`, (devices) => {
    console.log(devices)
    $(`#device-${id},#device_compare-${id}`).empty();
    devices.forEach((device) => {
      $(`#device-${id},#device_compare-${id}`).append(
        $("<option></option>")
          .attr("value", device[0])
          .text(device[1])
      );
    });
    $(`#device-${id},#device_compare-${id}`).selectpicker("refresh");
    displayResults(id, parentId);
  });
}

/**
 * Display results.
 * @param {id} id - Job id.
 */
function updateWorkflowList(id, timestamp) {
  call(`/get_workflow_results_list/${id}/${timestamp}`, (jobs) => {
    console.log(jobs)
    $(`#job-${id},#job_compare-${id}`).empty();
    jobs.forEach((job) => {
      $(`#job-${id},#job_compare-${id}`).append(
        $("<option></option>")
          .attr("value", job[0])
          .text(job[1])
      );
    });
    $(`#job-${id},#job_compare-${id}`).selectpicker("refresh");
    displayResults(id);
  });
}

/**
 * Display logs.
 * @param {firstTime} firstTime - First time.
 */
// eslint-disable-next-line
function refreshLogs(firstTime, id) {
  /*
  if (refreshJob[id]) {
    call(`/get_job_logs/${id}`, (job) => {
      //TODO
      //$(`#logs-${id}`).text(THE LOGS HERE);
      if (!job.running || $(`#logs-${id}`).length == 0) {
        refreshJob[id] = false;
      }
    });
    setTimeout(() => refreshLogs(false, id), 500);
  }
  */
}

/**
 * Show the results modal for a job.
 * @param {id} id - Job id.
 */
// eslint-disable-next-line
function showLogs(id, name) {
  if ($(`#logs-${id}`).length == 0) {
    jsPanel.create({
      theme: "dark filled",
      border: "medium",
      headerTitle: `Logs - ${name}`,
      position: "center-top 0 58",
      contentSize: "650 600",
      contentOverflow: "hidden scroll",
      content: `<pre id="logs-${id}" style="border: 0;\
        background-color: transparent; color: white;"></pre>`,
      dragit: {
        opacity: 0.7,
        containment: [5, 5, 5, 5],
      },
    });
  }
  refreshJob[id] = true;
  refreshLogs(true, id);
}

/**
 * Show the results modal for a job.
 * @param {id} id - Job id.
 */
// eslint-disable-next-line
function showResultsPanel(id, name, isWorkflow) {
  form = isWorkflow ? "workflow_results" : "results";
  createPanel(form, `Results - ${name}`, id, function() {
    configureCallbacks(id, isWorkflow);
    getTimestamps(id, isWorkflow);
  });
}

/**
 * Configure display & comparison callbacks
 * @param {id} id - Job id.
 */
// eslint-disable-next-line
function configureCallbacks(id, isWorkflow) {
  $(`#device-${id}`).on("change", function() {
    displayResults(id, isWorkflow);
  });

  $(`#timestamp-${id}`).on("change", function() {
    (isWorkflow ? updateWorkflowList : updateDeviceList)(id);
  });

  $(`#job-${id}`).on("change", function() {
    updateDeviceList(this.value, id);
  });

  $(`#compare_with-${id}`).on("change", function() {
    $(`#display_results-${id}`).empty();
    const v1 = $(`#display-${id}`).val();
    const v2 = $(`#compare_with-${id}`).val();
    call(`/get_results_diff/${id}/${v1}/${v2}`, function(data) {
      $(`#display_results-${id}`).append(
        diffview.buildView({
          baseTextLines: data.first,
          newTextLines: data.second,
          opcodes: data.opcodes,
          baseTextName: `${v1}`,
          newTextName: `${v2}`,
          contextSize: null,
          viewType: 0,
        })
      );
    });
  });

  $(`#display-text-${id},#display-json-${id}`).on("click", function() {
    displayResults(id, isWorkflow);
  });
}

/**
 * Clear the results
 * @param {id} id - Job id.
 */
// eslint-disable-next-line
function clearResults(id) {
  call(`/clear_results/${id}`, () => {
    $(`#display_results-${id},#compare_with-${id},#display-${id}`).empty();
    alertify.notify("Results cleared.", "success", 5);
    $(`#results-${id}`).remove();
  });
}

/**
 * Run job.
 * @param {id} id - Job id.
 */
// eslint-disable-next-line
function runJob(id, realTimeUpdate) {
  call(`/run_job/${id}`, function(job) {
    alertify.notify(`Job '${job.name}' started.`, "success", 5);
    if (page == "workflow_builder") {
      if (job.type == "Workflow") {
        getWorkflowState();
      } else {
        getJobState(id);
      }
    }
    if (realTimeUpdate) showLogs(id, job.name);
  });
}

/**
 * Display instance modal for editing.
 * @param {id} id - Instance ID.
 */
// eslint-disable-next-line
function duplicateWorkflow(id) {
  fCall(
    `/duplicate_workflow/${id}`,
    `#edit-workflow-form-${id}`,
    (workflow) => {
      table.ajax.reload(null, false);
      $(`#workflow-${id}`).remove();
      alertify.notify("Workflow successfully duplicated.", "success", 5);
    }
  );
}

/**
 * Export a job.
 * @param {int} id - Job ID.
 */
// eslint-disable-next-line
function exportJob(id) {
  call(`/export_job/${id}`, () => {
    alertify.notify("Export successful.", "success", 5);
  });
}

/**
 * Pause a task.
 * @param {id} id - Task id.
 */
// eslint-disable-next-line
function pauseTask(id) {
  // eslint-disable-line no-unused-vars
  call(`/task_action/pause/${id}`, function(result) {
    $(`#pause-resume-${id}`)
      .attr("onclick", `resumeTask('${id}')`)
      .text("Resume");
    alertify.notify("Task paused.", "success", 5);
  });
}

/**
 * Resume a task.
 * @param {id} id - Task id.
 */
// eslint-disable-next-line
function resumeTask(id) {
  // eslint-disable-line no-unused-vars
  call(`/task_action/resume/${id}`, function(result) {
    $(`#pause-resume-${id}`)
      .attr("onclick", `pauseTask('${id}')`)
      .text("Pause");
    alertify.notify("Task resumed.", "success", 5);
  });
}

(function() {
  if (page == "table/service" || page == "workflow_builder") {
    $("#service-type").selectpicker({
      liveSearch: true,
    });
  }
  if (page == "table/service" || page == "table/workflow") {
    refreshTable(3000);
  }
})();
